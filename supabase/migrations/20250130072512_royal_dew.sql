-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Update specific user to have super_admin role
UPDATE user_roles 
SET role = 'super_admin'
WHERE email = 'jareds.smith@gmail.com';

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;