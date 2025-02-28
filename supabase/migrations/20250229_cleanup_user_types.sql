-- Drop any existing triggers or functions related to old user_roles if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Remove all existing types and assignments
TRUNCATE user_types CASCADE;

-- Create the three main user types
INSERT INTO user_types (id, name, code, can_manage_users, can_manage_admins, can_manage_vendors, can_manage_designers, can_manage_staff, created_at)
VALUES 
  ('11111111-1111-4111-a111-111111111111', 'Super Admin', 'super_admin', true, true, true, true, true, NOW()),
  ('22222222-2222-4222-a222-222222222222', 'Admin', 'admin', true, false, true, true, true, NOW()),
  ('33333333-3333-4333-a333-333333333333', 'User', 'user', false, false, false, false, false, NOW());

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign default 'user' type to new users
  INSERT INTO user_type_assignments (id, user_id, type_id, assigned_at, metadata)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    '33333333-3333-4333-a333-333333333333',  -- User type ID
    NOW(),
    '{}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Assign super admin role to the specified user
INSERT INTO user_type_assignments (id, user_id, type_id, assigned_at, metadata)
VALUES (
  gen_random_uuid(),
  '4259afda-05ff-4679-aae2-fb87cebdfea8',  -- Your user ID
  '11111111-1111-4111-a111-111111111111',  -- Super Admin type ID
  NOW(),
  '{}'::jsonb
);

-- Ensure all existing users have at least the basic user type
INSERT INTO user_type_assignments (id, user_id, type_id, assigned_at, metadata)
SELECT 
  gen_random_uuid(),
  users.id,
  '33333333-3333-4333-a333-333333333333', -- User type ID
  NOW(),
  '{}'::jsonb
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_type_assignments WHERE user_id = users.id
); 