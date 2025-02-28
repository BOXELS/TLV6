-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Update any existing super_admin roles to admin
UPDATE user_roles
SET role = 'admin'
WHERE role::text = 'super_admin';

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Update specific users to admin role
UPDATE user_roles 
SET role = 'admin'
WHERE email IN ('jareds.smith@gmail.com', 'jared@boxels.com');