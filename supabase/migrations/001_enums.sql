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
