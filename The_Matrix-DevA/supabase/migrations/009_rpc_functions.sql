-- ============================================
-- AssetFlow Database Migration: RPC Functions
-- v1.1 Patch 4 — all atomic business operations
-- ============================================

-- ========== allocate_asset ==========
CREATE OR REPLACE FUNCTION allocate_asset(
  p_asset_id UUID,
  p_to_user_id UUID,
  p_expected_return DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_allocation_id UUID;
  v_asset_status asset_status;
  v_holder_name TEXT;
BEGIN
  SELECT status INTO v_asset_status FROM assets WHERE id = p_asset_id FOR UPDATE;

  IF v_asset_status IS NULL THEN
    RAISE EXCEPTION 'Asset not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_asset_status != 'available' THEN
    SELECT full_name INTO v_holder_name
    FROM profiles p
    JOIN allocations a ON a.allocated_to = p.id
    WHERE a.asset_id = p_asset_id AND a.is_active = true
    LIMIT 1;

    RAISE EXCEPTION 'Asset is currently % — held by %', v_asset_status, COALESCE(v_holder_name, 'unknown')
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO allocations (asset_id, allocated_to, allocated_by, department_id, expected_return)
  VALUES (
    p_asset_id,
    p_to_user_id,
    auth.uid(),
    (SELECT department_id FROM profiles WHERE id = p_to_user_id),
    p_expected_return
  ) RETURNING id INTO v_allocation_id;

  UPDATE assets SET status = 'allocated', updated_at = now() WHERE id = p_asset_id;

  INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'asset.allocated', 'allocation', v_allocation_id,
    jsonb_build_object('asset_id', p_asset_id, 'to_user_id', p_to_user_id));

  PERFORM create_notification(
    p_to_user_id, 'asset_assigned', 'Asset Assigned',
    'You have been allocated asset ' || (SELECT asset_tag FROM assets WHERE id = p_asset_id),
    p_asset_id, 'asset'
  );

  RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========== return_asset ==========
CREATE OR REPLACE FUNCTION return_asset(
  p_allocation_id UUID,
  p_return_condition TEXT,
  p_return_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_asset_id UUID;
BEGIN
  SELECT asset_id INTO v_asset_id
  FROM allocations WHERE id = p_allocation_id AND is_active = true;

  IF v_asset_id IS NULL THEN
    RAISE EXCEPTION 'Active allocation not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE allocations SET
    is_active = false,
    returned_at = now(),
    return_condition = p_return_condition,
    return_notes = p_return_notes
  WHERE id = p_allocation_id;

  UPDATE assets SET status = 'available', condition = p_return_condition, updated_at = now()
  WHERE id = v_asset_id;

  INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'asset.returned', 'allocation', p_allocation_id,
    jsonb_build_object('asset_id', v_asset_id, 'condition', p_return_condition));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========== approve_transfer ==========
CREATE OR REPLACE FUNCTION approve_transfer(
  p_transfer_id UUID
) RETURNS VOID AS $$
DECLARE
  v_asset_id UUID;
  v_from_id UUID;
  v_to_id UUID;
  v_old_allocation_id UUID;
BEGIN
  SELECT asset_id, from_holder_id, to_holder_id INTO v_asset_id, v_from_id, v_to_id
  FROM transfer_requests WHERE id = p_transfer_id AND status = 'requested';

  IF v_asset_id IS NULL THEN
    RAISE EXCEPTION 'Transfer request not found or not in requested state' USING ERRCODE = 'P0002';
  END IF;

  UPDATE transfer_requests SET
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = p_transfer_id;

  SELECT id INTO v_old_allocation_id
  FROM allocations WHERE asset_id = v_asset_id AND is_active = true;

  IF v_old_allocation_id IS NOT NULL THEN
    UPDATE allocations SET is_active = false, returned_at = now()
    WHERE id = v_old_allocation_id;
  END IF;

  INSERT INTO allocations (asset_id, allocated_to, allocated_by, department_id)
  VALUES (
    v_asset_id,
    v_to_id,
    auth.uid(),
    (SELECT department_id FROM profiles WHERE id = v_to_id)
  );

  UPDATE transfer_requests SET status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = p_transfer_id;

  INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'transfer.approved', 'transfer', p_transfer_id,
    jsonb_build_object('asset_id', v_asset_id, 'from', v_from_id, 'to', v_to_id));

  PERFORM create_notification(v_to_id, 'transfer_approved', 'Transfer Approved',
    'A transfer has been approved for asset ' || (SELECT asset_tag FROM assets WHERE id = v_asset_id),
    v_asset_id, 'asset');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========== book_resource ==========
CREATE OR REPLACE FUNCTION book_resource(
  p_asset_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_is_bookable BOOLEAN;
BEGIN
  SELECT is_bookable INTO v_is_bookable FROM assets WHERE id = p_asset_id;
  IF NOT v_is_bookable THEN
    RAISE EXCEPTION 'Asset is not a bookable resource' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO bookings (asset_id, booked_by, start_time, end_time, notes)
  VALUES (p_asset_id, auth.uid(), p_start_time, p_end_time, p_notes)
  RETURNING id INTO v_booking_id;

  INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'booking.created', 'booking', v_booking_id,
    jsonb_build_object('asset_id', p_asset_id, 'start', p_start_time, 'end', p_end_time));

  PERFORM create_notification(auth.uid(), 'booking_confirmed', 'Booking Confirmed',
    format('Your booking for %s on %s is confirmed',
      (SELECT name FROM assets WHERE id = p_asset_id),
      to_char(p_start_time, 'Mon DD, HH24:MI')),
    v_booking_id, 'booking');

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========== approve_maintenance ==========
CREATE OR REPLACE FUNCTION approve_maintenance(
  p_request_id UUID
) RETURNS VOID AS $$
DECLARE
  v_asset_id UUID;
  v_requester_id UUID;
BEGIN
  SELECT asset_id, requested_by INTO v_asset_id, v_requester_id
  FROM maintenance_requests WHERE id = p_request_id AND status = 'pending';

  IF v_asset_id IS NULL THEN
    RAISE EXCEPTION 'Maintenance request not found or not pending' USING ERRCODE = 'P0002';
  END IF;

  UPDATE maintenance_requests SET
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  UPDATE assets SET status = 'under_maintenance', updated_at = now() WHERE id = v_asset_id;

  INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'maintenance.approved', 'maintenance', p_request_id,
    jsonb_build_object('asset_id', v_asset_id));

  PERFORM create_notification(v_requester_id, 'maintenance_approved', 'Maintenance Approved',
    'Your maintenance request has been approved',
    p_request_id, 'maintenance');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========== resolve_maintenance ==========
CREATE OR REPLACE FUNCTION resolve_maintenance(
  p_request_id UUID,
  p_resolution_notes TEXT
) RETURNS VOID AS $$
DECLARE
  v_asset_id UUID;
  v_requester_id UUID;
BEGIN
  SELECT asset_id, requested_by INTO v_asset_id, v_requester_id
  FROM maintenance_requests WHERE id = p_request_id AND status IN ('in_progress', 'technician_assigned');

  IF v_asset_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or not in a resolvable state' USING ERRCODE = 'P0002';
  END IF;

  UPDATE maintenance_requests SET
    status = 'resolved',
    resolution_notes = p_resolution_notes,
    resolved_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  UPDATE assets SET status = 'available', updated_at = now() WHERE id = v_asset_id;

  INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'maintenance.resolved', 'maintenance', p_request_id,
    jsonb_build_object('asset_id', v_asset_id, 'notes', p_resolution_notes));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========== close_audit_cycle ==========
CREATE OR REPLACE FUNCTION close_audit_cycle(
  p_cycle_id UUID
) RETURNS TABLE(discrepancy_count BIGINT) AS $$
DECLARE
  v_count BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM audit_cycles WHERE id = p_cycle_id AND status != 'closed') THEN
    RAISE EXCEPTION 'Audit cycle not found or already closed' USING ERRCODE = 'P0002';
  END IF;

  UPDATE assets SET status = 'lost', updated_at = now()
  WHERE id IN (
    SELECT asset_id FROM audit_items
    WHERE audit_cycle_id = p_cycle_id AND status = 'missing'
  );

  UPDATE audit_cycles SET status = 'closed', closed_at = now(), updated_at = now()
  WHERE id = p_cycle_id;

  SELECT COUNT(*) INTO v_count
  FROM audit_items
  WHERE audit_cycle_id = p_cycle_id AND status != 'verified';

  INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'audit.closed', 'audit', p_cycle_id,
    jsonb_build_object('discrepancies', v_count));

  IF v_count > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    SELECT p.id, 'audit_discrepancy_flagged', 'Audit Discrepancies Found',
      format('%s discrepancies found in audit cycle', v_count),
      p_cycle_id, 'audit'
    FROM profiles p WHERE p.role IN ('admin', 'asset_manager');
  END IF;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========== create_audit_cycle ==========
CREATE OR REPLACE FUNCTION create_audit_cycle(
  p_name TEXT,
  p_scope_type TEXT,
  p_scope_value TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_auditor_ids UUID[]
) RETURNS UUID AS $$
DECLARE
  v_cycle_id UUID;
  v_auditor_id UUID;
BEGIN
  INSERT INTO audit_cycles (name, scope_type, scope_value, start_date, end_date, created_by)
  VALUES (p_name, p_scope_type, p_scope_value, p_start_date, p_end_date, auth.uid())
  RETURNING id INTO v_cycle_id;

  FOREACH v_auditor_id IN ARRAY p_auditor_ids
  LOOP
    INSERT INTO audit_assignments (audit_cycle_id, auditor_id)
    VALUES (v_cycle_id, v_auditor_id);
  END LOOP;

  IF p_scope_type = 'department' THEN
    INSERT INTO audit_items (audit_cycle_id, asset_id)
    SELECT v_cycle_id, a.id
    FROM assets a
    WHERE a.department_id = p_scope_value::UUID;
  ELSE
    INSERT INTO audit_items (audit_cycle_id, asset_id)
    SELECT v_cycle_id, a.id
    FROM assets a
    WHERE a.location ILIKE '%' || p_scope_value || '%';
  END IF;

  INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'audit.created', 'audit', v_cycle_id,
    jsonb_build_object('name', p_name, 'scope_type', p_scope_type, 'scope_value', p_scope_value));

  RETURN v_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
