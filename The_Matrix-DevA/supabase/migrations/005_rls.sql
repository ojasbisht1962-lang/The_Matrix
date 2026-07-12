-- ============================================
-- AssetFlow Database Migration: RLS Policies
-- v1.1 — all policies use has_role_privilege()
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

-- Insert via SECURITY DEFINER functions only — but need policy for those
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
