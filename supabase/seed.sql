-- ============================================
-- AssetFlow Seed Data
-- Run AFTER migrations, AFTER creating admin user via Supabase Auth
-- ============================================

-- Seed admin role (after user signs up with admin@assetflow.com)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@assetflow.com';

-- Sample departments
INSERT INTO departments (name, status) VALUES
  ('Engineering', 'active'),
  ('Marketing', 'active'),
  ('Human Resources', 'active'),
  ('Finance', 'active'),
  ('Operations', 'active');

-- Sample asset categories
INSERT INTO asset_categories (name, description, custom_fields) VALUES
  ('Laptops', 'Portable computing devices', '[{"field_name":"ram","field_type":"text"},{"field_name":"storage","field_type":"text"}]'),
  ('Monitors', 'Display screens and monitors', '[{"field_name":"size_inches","field_type":"number"},{"field_name":"resolution","field_type":"text"}]'),
  ('Furniture', 'Office furniture and fixtures', '[{"field_name":"material","field_type":"text"}]'),
  ('Meeting Rooms', 'Bookable meeting and conference rooms', '[{"field_name":"capacity","field_type":"number"},{"field_name":"has_projector","field_type":"text"}]'),
  ('Vehicles', 'Company vehicles', '[{"field_name":"license_plate","field_type":"text"},{"field_name":"mileage","field_type":"number"}]'),
  ('Peripherals', 'Keyboards, mice, headsets, etc.', '[]'),
  ('Network Equipment', 'Routers, switches, access points', '[{"field_name":"ip_address","field_type":"text"}]');

-- Storage buckets (run separately in Supabase dashboard or via supabase CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('asset-photos', 'asset-photos', true),
--   ('asset-documents', 'asset-documents', false),
--   ('maintenance-photos', 'maintenance-photos', false);
