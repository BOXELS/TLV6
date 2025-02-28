-- Drop existing policies
DROP POLICY IF EXISTS "View roles" ON user_roles;
DROP POLICY IF EXISTS "Manage roles" ON user_roles;
DROP POLICY IF EXISTS "Basic access policy" ON user_roles;
DROP POLICY IF EXISTS "Role modification policy" ON user_roles;

-- Disable RLS temporarily to ensure we can fix roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Ensure super_admin role for specific users
UPDATE user_roles 
SET role = 'super_admin'
WHERE email IN ('jared@boxels.com', 'jareds.smith@gmail.com');

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "user_roles_select_policy" 
ON user_roles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "user_roles_insert_policy" 
ON user_roles FOR INSERT 
TO authenticated 
WITH CHECK (
    -- Allow insert if table is empty (first user)
    NOT EXISTS (SELECT 1 FROM user_roles)
    OR
    -- Or if user is super_admin
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

CREATE POLICY "user_roles_update_policy" 
ON user_roles FOR UPDATE
TO authenticated 
USING (
    -- User can update their own role if they're super_admin
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

CREATE POLICY "user_roles_delete_policy" 
ON user_roles FOR DELETE
TO authenticated 
USING (
    -- Only super_admins can delete roles
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_email_role 
ON user_roles(email, role);