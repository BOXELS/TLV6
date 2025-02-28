-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Ensure email exists and role is set correctly
UPDATE user_roles 
SET role = 'super_admin',
    email = COALESCE(email, 'jareds.smith@gmail.com')
WHERE email = 'jareds.smith@gmail.com'
OR user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'jareds.smith@gmail.com'
);

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "view_user_roles" ON user_roles;
DROP POLICY IF EXISTS "manage_user_roles" ON user_roles;

-- Create single, simple SELECT policy
CREATE POLICY "select_user_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Create single, simple ALL policy for super_admins
CREATE POLICY "manage_user_roles"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);