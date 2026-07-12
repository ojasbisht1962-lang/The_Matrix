-- ============================================
-- AssetFlow Database Migration: Helper Functions
-- v1.1 — hierarchy-aware role checks
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Get current user's department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS UUID AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

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
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
