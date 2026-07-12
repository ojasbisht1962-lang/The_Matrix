-- =========================================================
-- AssetFlow Rich Demo Seed Data
-- Creates departments, categories, assets, users, allocations,
-- bookings, maintenance requests, and audit logs.
-- =========================================================

-- 1. Clean existing demo data (except system/admin accounts if needed)
-- (Safely delete down from children to parents)
DELETE FROM activity_logs;
DELETE FROM notifications;
DELETE FROM audit_items;
DELETE FROM audit_assignments;
DELETE FROM audit_cycles;
DELETE FROM maintenance_requests;
DELETE FROM bookings;
DELETE FROM allocations;
DELETE FROM assets;
DELETE FROM asset_categories;
DELETE FROM departments;

-- Delete non-admin auth users & profiles so we start fresh
DELETE FROM profiles WHERE email != 'admin@assetflow.com';
DELETE FROM auth.identities WHERE email != 'admin@assetflow.com';
DELETE FROM auth.users WHERE email != 'admin@assetflow.com';

-- 2. Insert Departments
INSERT INTO departments (id, name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Engineering', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Marketing', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Human Resources', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Finance', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'Operations', 'active');

-- Update the admin profile's department
UPDATE profiles SET department_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'admin@assetflow.com';

-- 3. Insert Categories
INSERT INTO asset_categories (id, name, description, custom_fields) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Laptops', 'High performance developer & office laptops', '[{"field_name":"RAM","field_type":"text"},{"field_name":"Storage","field_type":"text"},{"field_name":"OS","field_type":"text"}]'::jsonb),
  ('a2222222-2222-2222-2222-222222222222', 'Monitors', 'High resolution display monitors', '[{"field_name":"Resolution","field_type":"text"},{"field_name":"Ports","field_type":"text"}]'::jsonb),
  ('a3333333-3333-3333-3333-333333333333', 'Meeting Rooms', 'Company collaborative workspaces', '[{"field_name":"Capacity","field_type":"number"},{"field_name":"Projector","field_type":"text"}]'::jsonb),
  ('a4444444-4444-4444-4444-444444444444', 'Vehicles', 'Company logistics and executive fleet', '[{"field_name":"License Plate","field_type":"text"},{"field_name":"Mileage","field_type":"number"}]'::jsonb),
  ('a5555555-5555-5555-5555-555555555555', 'Furniture', 'Ergonomic chairs, desks, standing desks', '[{"field_name":"Material","field_type":"text"}]'::jsonb);

-- 4. Create Demo Users via Auth
-- All accounts have password: admin@123

DO $$
DECLARE
  v_uid_manager  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_uid_head     uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_uid_employee uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  v_uid_tech     uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
BEGIN

  -- A. Create Asset Manager: manager@assetflow.com
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (v_uid_manager, '00000000-0000-0000-0000-000000000000', 'manager@assetflow.com', crypt('admin@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins (Manager)"}', 'authenticated', 'authenticated');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_uid_manager, jsonb_build_object('sub', v_uid_manager, 'email', 'manager@assetflow.com', 'email_verified', true, 'phone_verified', false), 'email', v_uid_manager::text, now(), now(), now());

  -- B. Create Department Head: head@assetflow.com
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (v_uid_head, '00000000-0000-0000-0000-000000000000', 'head@assetflow.com', crypt('admin@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Miller (Head)"}', 'authenticated', 'authenticated');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_uid_head, jsonb_build_object('sub', v_uid_head, 'email', 'head@assetflow.com', 'email_verified', true, 'phone_verified', false), 'email', v_uid_head::text, now(), now(), now());

  -- C. Create Standard Employee: employee@assetflow.com
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (v_uid_employee, '00000000-0000-0000-0000-000000000000', 'employee@assetflow.com', crypt('admin@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Carter (Employee)"}', 'authenticated', 'authenticated');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_uid_employee, jsonb_build_object('sub', v_uid_employee, 'email', 'employee@assetflow.com', 'email_verified', true, 'phone_verified', false), 'email', v_uid_employee::text, now(), now(), now());

  -- D. Create Maintenance Technician: tech@assetflow.com
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (v_uid_tech, '00000000-0000-0000-0000-000000000000', 'tech@assetflow.com', crypt('admin@123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Brody (Tech)"}', 'authenticated', 'authenticated');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_uid_tech, jsonb_build_object('sub', v_uid_tech, 'email', 'tech@assetflow.com', 'email_verified', true, 'phone_verified', false), 'email', v_uid_tech::text, now(), now(), now());

END;
$$;

-- Wait briefly for profiles triggers to execute
SELECT pg_sleep(0.5);

-- Promote profiles to respective roles and departments
UPDATE profiles SET role = 'asset_manager', department_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'manager@assetflow.com';
UPDATE profiles SET role = 'department_head', department_id = '11111111-1111-1111-1111-111111111111' WHERE email = 'head@assetflow.com';
UPDATE profiles SET role = 'employee', department_id = '22222222-2222-2222-2222-222222222222' WHERE email = 'employee@assetflow.com';
UPDATE profiles SET role = 'employee', department_id = '55555555-5555-5555-5555-555555555555' WHERE email = 'tech@assetflow.com'; -- technicians are classified under operations role hierarchy

-- Update Engineering Head
UPDATE departments SET head_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' WHERE id = '11111111-1111-1111-1111-111111111111';

-- 5. Insert Assets
INSERT INTO assets (id, asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, status, is_bookable, department_id, documents, registered_by) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'AF-0001', 'MacBook Pro 16" M3 Max', 'a1111111-1111-1111-1111-111111111111', 'C02F89XXQ05D', '2025-01-10', 3499.00, 'new', 'HQ Desk 4A', 'allocated', false, '11111111-1111-1111-1111-111111111111', '[{"name":"Invoice","url":"#"}]'::jsonb, '865c7daa-8686-4228-8425-8574330b98aa'),
  ('e2222222-2222-2222-2222-222222222222', 'AF-0002', 'Dell XPS 15 9530', 'a1111111-1111-1111-1111-111111111111', '3X9K8Z2', '2025-02-15', 2199.00, 'good', 'Remote', 'allocated', false, '22222222-2222-2222-2222-222222222222', '[]'::jsonb, '865c7daa-8686-4228-8425-8574330b98aa'),
  ('e3333333-3333-3333-3333-333333333333', 'AF-0003', 'ThinkPad P16 Gen 2', 'a1111111-1111-1111-1111-111111111111', 'PF4892XK', '2025-03-01', 2599.00, 'good', 'HQ IT Storage', 'available', false, '11111111-1111-1111-1111-111111111111', '[]'::jsonb, '865c7daa-8686-4228-8425-8574330b98aa'),
  ('e4444444-4444-4444-4444-444444444444', 'AF-0004', 'Studio Display 27" 5K', 'a2222222-2222-2222-2222-222222222222', 'W69DK982D', '2025-01-12', 1599.00, 'new', 'HQ Room 102', 'available', false, '11111111-1111-1111-1111-111111111111', '[]'::jsonb, '865c7daa-8686-4228-8425-8574330b98aa'),
  ('e5555555-5555-5555-5555-555555555555', 'AF-0005', 'Conference Room A (Boardroom)', 'a3333333-3333-3333-3333-333333333333', 'ROOM-A', '2024-06-01', 12000.00, 'good', 'Main Lobby East', 'available', true, '55555555-5555-5555-5555-555555555555', '[]'::jsonb, '865c7daa-8686-4228-8425-8574330b98aa'),
  ('e6666666-6666-6666-6666-666666666666', 'AF-0006', 'Tesla Model 3 Executive', 'a4444444-4444-4444-4444-444444444444', '5YJ3E1EA', '2024-09-20', 42000.00, 'good', 'HQ Garage B3', 'under_maintenance', true, '55555555-5555-5555-5555-555555555555', '[]'::jsonb, '865c7daa-8686-4228-8425-8574330b98aa'),
  ('e7777777-7777-7777-7777-777777777777', 'AF-0007', 'Ergonomic Standing Desk', 'a5555555-5555-5555-5555-555555555555', 'DESK-882', '2024-11-01', 650.00, 'good', 'HQ Floor 2', 'available', false, '22222222-2222-2222-2222-222222222222', '[]'::jsonb, '865c7daa-8686-4228-8425-8574330b98aa');

-- 6. Insert Allocations (Active and Historical)
INSERT INTO allocations (id, asset_id, allocated_to, allocated_by, department_id, allocated_at, expected_return, returned_at, is_active, return_condition) VALUES
  -- MacBook allocated to David Head (Active)
  ('d1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '865c7daa-8686-4228-8425-8574330b98aa', '11111111-1111-1111-1111-111111111111', now() - interval '3 months', now() + interval '9 months', null, true, null),
  -- Dell XPS allocated to Alex Employee (Active)
  ('d2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '865c7daa-8686-4228-8425-8574330b98aa', '22222222-2222-2222-2222-222222222222', now() - interval '1 month', now() + interval '5 months', null, true, null),
  -- Historical ThinkPad allocation that was returned
  ('d3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '865c7daa-8686-4228-8425-8574330b98aa', '22222222-2222-2222-2222-222222222222', now() - interval '6 months', now() - interval '4 months', now() - interval '4 months', false, 'good');

-- 7. Insert Bookings (Active and Future)
INSERT INTO bookings (id, asset_id, booked_by, start_time, end_time, status, notes) VALUES
  -- Ongoing booking for Boardroom
  ('c1111111-1111-1111-1111-111111111111', 'e5555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', now() - interval '1 hour', now() + interval '2 hours', 'ongoing', 'Q2 Planning & Strategy Review'),
  -- Upcoming booking
  ('c2222222-2222-2222-2222-222222222222', 'e5555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now() + interval '1 day', now() + interval '1 day 2 hours', 'upcoming', 'Marketing Campaign Brainstorming');

-- 8. Insert Maintenance Requests
INSERT INTO maintenance_requests (id, asset_id, requested_by, description, priority, status, approved_by, technician_id, resolution_notes, approved_at, assigned_at, started_at, resolved_at, created_at) VALUES
  -- Tesla in progress
  ('f1111111-1111-1111-1111-111111111111', 'e6666666-6666-6666-6666-666666666666', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Scheduled 20k-mile service check. Battery coolant inspection and tire rotation.', 'medium', 'in_progress', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', null, now() - interval '3 days', now() - interval '2 days', now() - interval '1 day', null, now() - interval '4 days'),
  -- Standing desk pending approval
  ('f2222222-2222-2222-2222-222222222222', 'e7777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Motor making grinding noise when lifting. Desk struggles to raise to standing height.', 'high', 'pending', null, null, null, null, null, null, null, now() - interval '6 hours');

-- 9. Insert Activity Logs (For Auditor and admin reports)
INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES
  ('865c7daa-8686-4228-8425-8574330b98aa', 'asset.create', 'asset', 'e1111111-1111-1111-1111-111111111111', '{"name":"MacBook Pro"}'::jsonb, now() - interval '4 months'),
  ('865c7daa-8686-4228-8425-8574330b98aa', 'asset.create', 'asset', 'e6666666-6666-6666-6666-666666666666', '{"name":"Tesla Model 3"}'::jsonb, now() - interval '10 months'),
  ('865c7daa-8686-4228-8425-8574330b98aa', 'asset.allocated', 'allocation', 'd1111111-1111-1111-1111-111111111111', '{"asset_id":"e1111111-1111-1111-1111-111111111111","to_user_id":"cccccccc-cccc-cccc-cccc-cccccccccccc"}'::jsonb, now() - interval '3 months'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'booking.created', 'booking', 'c1111111-1111-1111-1111-111111111111', '{"asset_id":"e5555555-5555-5555-5555-555555555555"}'::jsonb, now() - interval '1 day'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'maintenance.created', 'maintenance', 'f1111111-1111-1111-1111-111111111111', '{"asset_id":"e6666666-6666-6666-6666-666666666666"}'::jsonb, now() - interval '4 days');

-- 10. Insert Audit Cycles
INSERT INTO audit_cycles (id, name, scope_type, scope_value, start_date, end_date, status, created_by, closed_at, created_at, updated_at) VALUES
  ('91111111-1111-1111-1111-111111111111', 'Q1 Engineering Asset Audit', 'department', '11111111-1111-1111-1111-111111111111', '2026-01-01', '2026-01-15', 'closed', '865c7daa-8686-4228-8425-8574330b98aa', '2026-01-14 16:30:00+00', '2026-01-01 09:00:00+00', '2026-01-14 16:30:00+00'),
  ('92222222-2222-2222-2222-222222222222', 'Q2 HQ General Asset Audit', 'location', 'HQ', '2026-07-01', '2026-07-31', 'in_progress', '865c7daa-8686-4228-8425-8574330b98aa', null, '2026-07-01 09:00:00+00', '2026-07-01 09:00:00+00');

-- 11. Insert Audit Assignments
INSERT INTO audit_assignments (id, audit_cycle_id, auditor_id, assigned_at) VALUES
  ('81111111-1111-1111-1111-111111111111', '91111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-01-01 09:05:00+00'),
  ('82222222-2222-2222-2222-222222222222', '92222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-07-01 09:05:00+00');

-- 12. Insert Audit Items
INSERT INTO audit_items (id, audit_cycle_id, asset_id, auditor_id, status, notes, verified_at, created_at) VALUES
  -- Cycle 1 (Closed)
  (gen_random_uuid(), '91111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'verified', 'Confirmed in good condition at Desk 4A', '2026-01-05 10:00:00+00', '2026-01-01 09:05:00+00'),
  (gen_random_uuid(), '91111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'verified', 'Audited remotely via screenshot proof', '2026-01-06 14:20:00+00', '2026-01-01 09:05:00+00'),
  (gen_random_uuid(), '91111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'damaged', 'Screen hinge is loose, needs maintenance ticket raised', '2026-01-07 11:30:00+00', '2026-01-01 09:05:00+00'),

  -- Cycle 2 (In Progress)
  (gen_random_uuid(), '92222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', null, 'pending', null, null, '2026-07-01 09:05:00+00'),
  (gen_random_uuid(), '92222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'verified', 'Verified location matches remote database', now() - interval '2 days', '2026-07-01 09:05:00+00'),
  (gen_random_uuid(), '92222222-2222-2222-2222-222222222222', 'e4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'missing', 'Not found in Room 102 as registered, search initiated', now() - interval '1 day', '2026-07-01 09:05:00+00'),
  (gen_random_uuid(), '92222222-2222-2222-2222-222222222222', 'e7777777-7777-7777-7777-777777777777', null, 'pending', null, null, '2026-07-01 09:05:00+00');
