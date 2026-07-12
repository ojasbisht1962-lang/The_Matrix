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
    -- User already exists — just ensure admin role
    UPDATE profiles
    SET role = 'admin'
    WHERE id = existing_id;

    RAISE NOTICE 'Existing user updated to admin role (id: %)', existing_id;
  END IF;
END;
$$;
