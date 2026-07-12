-- ============================================
-- AssetFlow Database Migration: Tables
-- v1.1 patched — no current_holder_id/expected_return_date on assets
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

-- Profiles — linked to Supabase Auth
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
