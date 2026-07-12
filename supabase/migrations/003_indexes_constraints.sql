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
