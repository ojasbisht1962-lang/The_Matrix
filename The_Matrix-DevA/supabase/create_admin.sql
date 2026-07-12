-- ============================================
-- Create admin user: admin@assetflow.com
-- ============================================

DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'admin@assetflow.com';

  IF existing_user_id IS NULL THEN
    -- Create the auth user with confirmed email
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

    RAISE NOTICE 'New auth user created with id: %', new_user_id;

    -- Update profile role to admin (trigger auto-creates profile row)
    -- Small wait for trigger to fire
    PERFORM pg_sleep(0.5);
    UPDATE profiles SET role = 'admin' WHERE id = new_user_id;
    RAISE NOTICE 'Profile role set to admin';

  ELSE
    -- User already exists, just update the profile role
    RAISE NOTICE 'User already exists with id: %, updating role to admin', existing_user_id;
    UPDATE profiles SET role = 'admin' WHERE id = existing_user_id;
    RAISE NOTICE 'Profile role updated to admin';
  END IF;
END;
$$;

-- Verify the result
SELECT u.id, u.email, u.email_confirmed_at, p.role, p.status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@assetflow.com';
