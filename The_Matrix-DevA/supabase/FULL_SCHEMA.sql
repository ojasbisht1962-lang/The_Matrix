-- ============================================
-- AssetFlow Database Migration: Enums
-- ============================================

-- Asset lifecycle statuses
CREATE TYPE asset_status AS ENUM (
  'available',
  'allocated',
  'reserved',
  'under_maintenance',
  'lost',
  'retired',
  'disposed'
);

-- User roles
CREATE TYPE user_role AS ENUM (
  'employee',
  'department_head',
  'asset_manager',
  'admin'
);

-- Transfer workflow states
CREATE TYPE transfer_status AS ENUM (
  'requested',
  'approved',
  'rejected',
  'completed'
);

-- Booking states
CREATE TYPE booking_status AS ENUM (
  'upcoming',
  'ongoing',
  'completed',
  'cancelled'
);

-- Maintenance workflow states
CREATE TYPE maintenance_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'technician_assigned',
  'in_progress',
  'resolved'
);

-- Maintenance priority
CREATE TYPE maintenance_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Audit item verification status
CREATE TYPE audit_item_status AS ENUM (
  'pending',
  'verified',
  'missing',
  'damaged'
);

-- Audit cycle state
CREATE TYPE audit_cycle_status AS ENUM (
  'open',
  'in_progress',
  'closed'
);

-- Department/entity status
CREATE TYPE entity_status AS ENUM (
  'active',
  'inactive'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'asset_assigned',
  'maintenance_approved',
  'maintenance_rejected',
  'booking_confirmed',
  'booking_cancelled',
  'booking_reminder',
  'transfer_approved',
  'transfer_rejected',
  'overdue_return_alert',
  'audit_discrepancy_flagged',
  'role_changed'
);
-- ============================================
-- AssetFlow Database Migration: Tables
-- v1.1 patched â€” no current_holder_id/expected_return_date on assets
-- ============================================

-- Departments
CREATE TABLE departments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  head_id           UUID, -- FK added after profiles exists
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status            entity_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles â€” linked to Supabase Auth
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          user_role NOT NULL DEFAULT 'employee',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status        entity_status NOT NULL DEFAULT 'active',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now add FK from departments.head_id to profiles
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_head
  FOREIGN KEY (head_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Asset categories
CREATE TABLE asset_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  custom_fields   JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assets (v1.1: NO current_holder_id, NO expected_return_date)
CREATE TABLE assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag         TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  category_id       UUID NOT NULL REFERENCES asset_categories(id) ON DELETE RESTRICT,
  serial_number     TEXT,
  acquisition_date  DATE,
  acquisition_cost  NUMERIC(12,2),
  condition         TEXT DEFAULT 'new',
  location          TEXT,
  status            asset_status NOT NULL DEFAULT 'available',
  is_bookable       BOOLEAN NOT NULL DEFAULT false,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  photo_url         TEXT,
  documents         JSONB DEFAULT '[]'::jsonb,
  custom_field_values JSONB DEFAULT '{}'::jsonb,
  registered_by     UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allocations
CREATE TABLE allocations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  allocated_to      UUID NOT NULL REFERENCES profiles(id),
  allocated_by      UUID NOT NULL REFERENCES profiles(id),
  department_id     UUID REFERENCES departments(id),
  allocated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_return   DATE,
  returned_at       TIMESTAMPTZ,
  return_condition  TEXT,
  return_notes      TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transfer requests
CREATE TABLE transfer_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  from_holder_id  UUID NOT NULL REFERENCES profiles(id),
  to_holder_id    UUID NOT NULL REFERENCES profiles(id),
  requested_by    UUID NOT NULL REFERENCES profiles(id),
  status          transfer_status NOT NULL DEFAULT 'requested',
  approved_by     UUID REFERENCES profiles(id),
  reason          TEXT,
  approved_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  booked_by     UUID NOT NULL REFERENCES profiles(id),
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  status        booking_status NOT NULL DEFAULT 'upcoming',
  notes         TEXT,
  cancelled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_booking_time CHECK (end_time > start_time)
);

-- Maintenance requests
CREATE TABLE maintenance_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES profiles(id),
  description     TEXT NOT NULL,
  priority        maintenance_priority NOT NULL DEFAULT 'medium',
  status          maintenance_status NOT NULL DEFAULT 'pending',
  photo_url       TEXT,
  approved_by     UUID REFERENCES profiles(id),
  technician_id   UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  approved_at     TIMESTAMPTZ,
  assigned_at     TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit cycles
CREATE TABLE audit_cycles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  scope_type    TEXT NOT NULL CHECK (scope_type IN ('department', 'location')),
  scope_value   TEXT NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        audit_cycle_status NOT NULL DEFAULT 'open',
  created_by    UUID NOT NULL REFERENCES profiles(id),
  closed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_audit_dates CHECK (end_date >= start_date)
);

-- Audit assignments
CREATE TABLE audit_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_cycle_id  UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  auditor_id      UUID NOT NULL REFERENCES profiles(id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_cycle_id, auditor_id)
);

-- Audit items
CREATE TABLE audit_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_cycle_id  UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  auditor_id      UUID REFERENCES profiles(id),
  status          audit_item_status NOT NULL DEFAULT 'pending',
  notes           TEXT,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_cycle_id, asset_id)
);

-- Notifications
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  reference_id  UUID,
  reference_type TEXT,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity logs
CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID NOT NULL REFERENCES profiles(id),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ============================================
-- AssetFlow Database Migration: Indexes & Constraints
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department_id);

-- Departments indexes
CREATE INDEX idx_departments_head ON departments(head_id);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);

-- Assets indexes
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_department ON assets(department_id);
CREATE INDEX idx_assets_tag ON assets(asset_tag);
CREATE INDEX idx_assets_bookable ON assets(is_bookable) WHERE is_bookable = true;

-- Allocations indexes
CREATE INDEX idx_allocations_asset ON allocations(asset_id);
CREATE INDEX idx_allocations_holder ON allocations(allocated_to);
CREATE INDEX idx_allocations_active ON allocations(is_active) WHERE is_active = true;
CREATE INDEX idx_allocations_overdue ON allocations(expected_return)
  WHERE is_active = true AND expected_return IS NOT NULL;

-- Transfer indexes
CREATE INDEX idx_transfers_asset ON transfer_requests(asset_id);
CREATE INDEX idx_transfers_status ON transfer_requests(status);

-- Bookings indexes
CREATE INDEX idx_bookings_asset ON bookings(asset_id);
CREATE INDEX idx_bookings_time ON bookings(asset_id, start_time, end_time);
CREATE INDEX idx_bookings_user ON bookings(booked_by);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Booking overlap prevention (exclusion constraint)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    asset_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'completed'));

-- Maintenance indexes
CREATE INDEX idx_maintenance_asset ON maintenance_requests(asset_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);

-- Audit indexes
CREATE INDEX idx_audit_cycles_status ON audit_cycles(status);
CREATE INDEX idx_audit_items_cycle ON audit_items(audit_cycle_id);
CREATE INDEX idx_audit_items_status ON audit_items(status);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read)
  WHERE is_read = false;

-- Activity log indexes
CREATE INDEX idx_activity_actor ON activity_logs(actor_id);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
-- ============================================
-- AssetFlow Database Migration: Helper Functions
-- v1.1 â€” hierarchy-aware role checks
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Role hierarchy numeric level (v1.1 Patch 2)
CREATE OR REPLACE FUNCTION role_level(r user_role)
RETURNS INT AS $$
  SELECT CASE r
    WHEN 'admin'           THEN 40
    WHEN 'asset_manager'   THEN 30
    WHEN 'department_head' THEN 20
    WHEN 'employee'        THEN 10
  END;
$$ LANGUAGE sql IMMUTABLE;

-- Hierarchy-aware privilege check (v1.1 Patch 2)
CREATE OR REPLACE FUNCTION has_role_privilege(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT role_level(get_user_role()) >= role_level(required_role);
$$ LANGUAGE sql SECURITY DEFINER STABLE;
-- ============================================
-- AssetFlow Database Migration: RLS Policies
-- v1.1 â€” all policies use has_role_privilege()
-- ============================================

-- Enable RLS on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES ==========
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_select_all ON profiles
  FOR SELECT USING (has_role_privilege('asset_manager'));

CREATE POLICY profiles_select_dept ON profiles
  FOR SELECT USING (
    get_user_role() = 'department_head'
    AND department_id = get_user_department()
  );

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_role ON profiles
  FOR UPDATE USING (has_role_privilege('admin'))
  WITH CHECK (has_role_privilege('admin'));

CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ========== DEPARTMENTS ==========
CREATE POLICY departments_select ON departments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY departments_insert ON departments
  FOR INSERT WITH CHECK (has_role_privilege('admin'));

CREATE POLICY departments_update ON departments
  FOR UPDATE USING (has_role_privilege('admin'))
  WITH CHECK (has_role_privilege('admin'));

-- ========== ASSET CATEGORIES ==========
CREATE POLICY categories_select ON asset_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY categories_insert ON asset_categories
  FOR INSERT WITH CHECK (has_role_privilege('admin'));

CREATE POLICY categories_update ON asset_categories
  FOR UPDATE USING (has_role_privilege('admin'))
  WITH CHECK (has_role_privilege('admin'));

-- ========== ASSETS ==========
CREATE POLICY assets_select_all ON assets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY assets_insert ON assets
  FOR INSERT WITH CHECK (has_role_privilege('asset_manager'));

CREATE POLICY assets_update ON assets
  FOR UPDATE USING (has_role_privilege('asset_manager'))
  WITH CHECK (has_role_privilege('asset_manager'));

-- ========== ALLOCATIONS ==========
CREATE POLICY alloc_select_own ON allocations
  FOR SELECT USING (allocated_to = auth.uid());

CREATE POLICY alloc_select_manager ON allocations
  FOR SELECT USING (has_role_privilege('asset_manager'));

CREATE POLICY alloc_select_dept_head ON allocations
  FOR SELECT USING (
    get_user_role() = 'department_head'
    AND department_id = get_user_department()
  );

CREATE POLICY alloc_insert ON allocations
  FOR INSERT WITH CHECK (has_role_privilege('asset_manager'));

CREATE POLICY alloc_update ON allocations
  FOR UPDATE USING (has_role_privilege('asset_manager'))
  WITH CHECK (has_role_privilege('asset_manager'));

-- ========== TRANSFER REQUESTS ==========
CREATE POLICY transfer_select ON transfer_requests
  FOR SELECT USING (
    requested_by = auth.uid()
    OR from_holder_id = auth.uid()
    OR to_holder_id = auth.uid()
    OR has_role_privilege('department_head')
  );

CREATE POLICY transfer_insert ON transfer_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY transfer_update ON transfer_requests
  FOR UPDATE USING (has_role_privilege('department_head'))
  WITH CHECK (has_role_privilege('department_head'));

-- ========== BOOKINGS ==========
CREATE POLICY bookings_select ON bookings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY bookings_insert ON bookings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY bookings_update_own ON bookings
  FOR UPDATE USING (booked_by = auth.uid())
  WITH CHECK (booked_by = auth.uid());

CREATE POLICY bookings_update_manager ON bookings
  FOR UPDATE USING (has_role_privilege('asset_manager'))
  WITH CHECK (has_role_privilege('asset_manager'));

-- ========== MAINTENANCE REQUESTS ==========
CREATE POLICY maint_select_own ON maintenance_requests
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY maint_select_manager ON maintenance_requests
  FOR SELECT USING (has_role_privilege('asset_manager'));

CREATE POLICY maint_insert ON maintenance_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY maint_update ON maintenance_requests
  FOR UPDATE USING (has_role_privilege('asset_manager'))
  WITH CHECK (has_role_privilege('asset_manager'));

-- ========== AUDIT CYCLES ==========
CREATE POLICY audit_cycles_select ON audit_cycles
  FOR SELECT USING (
    has_role_privilege('asset_manager')
    OR EXISTS (
      SELECT 1 FROM audit_assignments
      WHERE audit_cycle_id = audit_cycles.id
      AND auditor_id = auth.uid()
    )
  );

CREATE POLICY audit_cycles_insert ON audit_cycles
  FOR INSERT WITH CHECK (has_role_privilege('admin'));

CREATE POLICY audit_cycles_update ON audit_cycles
  FOR UPDATE USING (has_role_privilege('admin'))
  WITH CHECK (has_role_privilege('admin'));

-- ========== AUDIT ASSIGNMENTS ==========
CREATE POLICY audit_assignments_select ON audit_assignments
  FOR SELECT USING (
    has_role_privilege('asset_manager')
    OR auditor_id = auth.uid()
  );

CREATE POLICY audit_assignments_insert ON audit_assignments
  FOR INSERT WITH CHECK (has_role_privilege('admin'));

-- ========== AUDIT ITEMS ==========
CREATE POLICY audit_items_select ON audit_items
  FOR SELECT USING (
    has_role_privilege('asset_manager')
    OR auditor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM audit_assignments
      WHERE audit_cycle_id = audit_items.audit_cycle_id
      AND auditor_id = auth.uid()
    )
  );

CREATE POLICY audit_items_update ON audit_items
  FOR UPDATE USING (
    auditor_id = auth.uid()
    OR has_role_privilege('admin')
    OR EXISTS (
      SELECT 1 FROM audit_assignments
      WHERE audit_cycle_id = audit_items.audit_cycle_id
      AND auditor_id = auth.uid()
    )
  );

-- ========== NOTIFICATIONS ==========
CREATE POLICY notif_select ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notif_update ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert via SECURITY DEFINER functions only â€” but need policy for those
CREATE POLICY notif_insert ON notifications
  FOR INSERT WITH CHECK (true);

-- ========== ACTIVITY LOGS ==========
CREATE POLICY logs_select_own ON activity_logs
  FOR SELECT USING (actor_id = auth.uid());

CREATE POLICY logs_select_dept ON activity_logs
  FOR SELECT USING (
    get_user_role() = 'department_head'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = activity_logs.actor_id
      AND department_id = get_user_department()
    )
  );

CREATE POLICY logs_select_all ON activity_logs
  FOR SELECT USING (has_role_privilege('asset_manager'));

-- Insert via SECURITY DEFINER functions only
CREATE POLICY logs_insert ON activity_logs
  FOR INSERT WITH CHECK (true);
-- ============================================
-- AssetFlow Database Migration: Triggers
-- v1.1 â€” only retained triggers (asset tag, new user, mat view refresh)
-- trg_maintenance_status and trg_audit_cycle_close REMOVED (moved to RPCs)
-- ============================================

-- Asset tag auto-generation sequence + trigger
CREATE SEQUENCE asset_tag_seq START 1;

CREATE OR REPLACE FUNCTION generate_asset_tag()
RETURNS TRIGGER AS $$
BEGIN
  NEW.asset_tag := 'AF-' || LPAD(nextval('asset_tag_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_asset_tag
  BEFORE INSERT ON assets
  FOR EACH ROW
  WHEN (NEW.asset_tag IS NULL)
  EXECUTE FUNCTION generate_asset_tag();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
-- ============================================
-- AssetFlow Database Migration: Views
-- v1.1 â€” materialized view for current allocation + enriched asset view
-- ============================================

-- Materialized view: current holder per asset (v1.1 Patch 1)
CREATE MATERIALIZED VIEW asset_current_allocation AS
SELECT
  a.asset_id,
  a.allocated_to    AS current_holder_id,
  a.expected_return  AS expected_return_date,
  a.allocated_at,
  a.department_id    AS allocation_department_id
FROM allocations a
WHERE a.is_active = true;

CREATE UNIQUE INDEX idx_aca_asset ON asset_current_allocation(asset_id);
CREATE INDEX idx_aca_holder ON asset_current_allocation(current_holder_id);

-- Auto-refresh materialized view on allocation changes (v1.1)
CREATE OR REPLACE FUNCTION refresh_asset_current_allocation()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY asset_current_allocation;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_refresh_aca
  AFTER INSERT OR UPDATE OR DELETE ON allocations
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_asset_current_allocation();

-- Enriched asset view â€” primary query surface for frontend (v1.1 Patch 1)
CREATE VIEW assets_enriched AS
SELECT
  a.*,
  c.name         AS category_name,
  c.custom_fields AS category_custom_fields,
  d.name         AS department_name,
  aca.current_holder_id,
  aca.expected_return_date,
  aca.allocated_at AS current_allocation_date,
  holder.full_name AS current_holder_name,
  holder.email     AS current_holder_email
FROM assets a
LEFT JOIN asset_categories c ON c.id = a.category_id
LEFT JOIN departments d ON d.id = a.department_id
LEFT JOIN asset_current_allocation aca ON aca.asset_id = a.id
LEFT JOIN profiles holder ON holder.id = aca.current_holder_id;

-- Dashboard KPI view
CREATE VIEW dashboard_kpis AS
SELECT
  COUNT(*) FILTER (WHERE status = 'available') AS assets_available,
  COUNT(*) FILTER (WHERE status = 'allocated') AS assets_allocated,
  (SELECT COUNT(*) FROM maintenance_requests
   WHERE status IN ('approved','technician_assigned','in_progress')
   AND DATE(created_at) = CURRENT_DATE) AS maintenance_today,
  (SELECT COUNT(*) FROM bookings
   WHERE status IN ('upcoming','ongoing')) AS active_bookings,
  (SELECT COUNT(*) FROM transfer_requests
   WHERE status = 'requested') AS pending_transfers,
  (SELECT COUNT(*) FROM allocations
   WHERE is_active = true AND expected_return IS NOT NULL
   AND expected_return < CURRENT_DATE) AS overdue_returns
FROM assets;

-- Overdue allocations view
CREATE VIEW overdue_allocations AS
SELECT
  a.id AS allocation_id,
  a.asset_id,
  ast.asset_tag,
  ast.name AS asset_name,
  a.allocated_to,
  p.full_name AS holder_name,
  a.expected_return,
  CURRENT_DATE - a.expected_return AS days_overdue
FROM allocations a
JOIN assets ast ON ast.id = a.asset_id
JOIN profiles p ON p.id = a.allocated_to
WHERE a.is_active = true
  AND a.expected_return IS NOT NULL
  AND a.expected_return < CURRENT_DATE
ORDER BY a.expected_return ASC;
-- ============================================
-- AssetFlow Database Migration: Notification Helper
-- ============================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_ref_id UUID DEFAULT NULL,
  p_ref_type TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
  VALUES (p_user_id, p_type, p_title, p_message, p_ref_id, p_ref_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- AssetFlow Database Migration: RPC Functions
-- v1.1 Patch 4 â€” all atomic business operations
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

    RAISE EXCEPTION 'Asset is currently % â€” held by %', v_asset_status, COALESCE(v_holder_name, 'unknown')
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- AssetFlow Database Migration: Analytics Functions
-- For Developer D's Reports & Analytics page
-- ============================================

CREATE OR REPLACE FUNCTION get_utilization_by_department()
RETURNS TABLE(department_name TEXT, available BIGINT, allocated BIGINT, maintenance BIGINT) AS $$
  SELECT d.name,
    COUNT(*) FILTER (WHERE a.status = 'available'),
    COUNT(*) FILTER (WHERE a.status = 'allocated'),
    COUNT(*) FILTER (WHERE a.status = 'under_maintenance')
  FROM assets a
  JOIN departments d ON d.id = a.department_id
  GROUP BY d.name ORDER BY d.name;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_maintenance_frequency(group_by TEXT DEFAULT 'category')
RETURNS TABLE(group_name TEXT, request_count BIGINT) AS $$
BEGIN
  IF group_by = 'category' THEN
    RETURN QUERY
      SELECT c.name, COUNT(*)
      FROM maintenance_requests mr
      JOIN assets a ON a.id = mr.asset_id
      JOIN asset_categories c ON c.id = a.category_id
      GROUP BY c.name ORDER BY COUNT(*) DESC;
  ELSE
    RETURN QUERY
      SELECT a.name, COUNT(*)
      FROM maintenance_requests mr
      JOIN assets a ON a.id = mr.asset_id
      GROUP BY a.name ORDER BY COUNT(*) DESC LIMIT 20;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_most_used_assets(result_limit INT DEFAULT 10)
RETURNS TABLE(asset_tag TEXT, asset_name TEXT, booking_count BIGINT) AS $$
  SELECT a.asset_tag, a.name, COUNT(b.id)
  FROM bookings b
  JOIN assets a ON a.id = b.asset_id
  WHERE b.status != 'cancelled'
  GROUP BY a.asset_tag, a.name
  ORDER BY COUNT(b.id) DESC LIMIT result_limit;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_idle_assets(days INT DEFAULT 30)
RETURNS TABLE(asset_tag TEXT, asset_name TEXT, category TEXT, last_activity TIMESTAMPTZ) AS $$
  SELECT a.asset_tag, a.name, c.name,
    GREATEST(
      (SELECT MAX(al.allocated_at) FROM allocations al WHERE al.asset_id = a.id),
      (SELECT MAX(b.start_time) FROM bookings b WHERE b.asset_id = a.id)
    ) AS last_activity
  FROM assets a
  JOIN asset_categories c ON c.id = a.category_id
  WHERE a.status = 'available'
    AND NOT EXISTS (
      SELECT 1 FROM allocations al WHERE al.asset_id = a.id AND al.allocated_at > now() - (days || ' days')::interval
    )
    AND NOT EXISTS (
      SELECT 1 FROM bookings b WHERE b.asset_id = a.id AND b.start_time > now() - (days || ' days')::interval
    )
  ORDER BY last_activity ASC NULLS FIRST;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_booking_heatmap()
RETURNS TABLE(day_of_week INT, hour_of_day INT, booking_count BIGINT) AS $$
  SELECT EXTRACT(DOW FROM start_time)::INT,
         EXTRACT(HOUR FROM start_time)::INT,
         COUNT(*)
  FROM bookings WHERE status != 'cancelled'
  GROUP BY 1, 2 ORDER BY 1, 2;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_department_allocation_summary()
RETURNS TABLE(department_name TEXT, total_allocated BIGINT, total_assets BIGINT, utilization_pct NUMERIC) AS $$
  SELECT d.name,
    COUNT(*) FILTER (WHERE a.status = 'allocated'),
    COUNT(*),
    ROUND(COUNT(*) FILTER (WHERE a.status = 'allocated')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1)
  FROM assets a
  JOIN departments d ON d.id = a.department_id
  GROUP BY d.name ORDER BY d.name;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
-- ============================================
-- AssetFlow Database Migration: Realtime Publication
-- v1.1 Patch 3 â€” 5 tables for Realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE assets;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE transfer_requests;
-- ============================================
-- AssetFlow Migration 012: Seed Admin User
-- Creates admin@assetflow.com with admin role
-- ============================================

DO $$
DECLARE
  new_user_id   uuid;
  existing_id   uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_id
  FROM auth.users
  WHERE email = 'admin@assetflow.com';

  IF existing_id IS NULL THEN
    -- Create confirmed auth user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@assetflow.com',
      crypt('AsF!owAdm#9Xk2$mR', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"AssetFlow Admin"}',
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO new_user_id;

    -- Wait briefly for the on_auth_user_created trigger to insert the profile row
    PERFORM pg_sleep(0.5);

    -- Promote to admin
    UPDATE profiles
    SET role = 'admin'
    WHERE id = new_user_id;

    RAISE NOTICE 'Admin user created: % (id: %)', 'admin@assetflow.com', new_user_id;

  ELSE
    -- User already exists â€” just ensure admin role
    UPDATE profiles
    SET role = 'admin'
    WHERE id = existing_id;

    RAISE NOTICE 'Existing user updated to admin role (id: %)', existing_id;
  END IF;
END;
$$;
