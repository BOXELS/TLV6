-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "View roles" ON user_roles;
DROP POLICY IF EXISTS "Manage roles" ON user_roles;
DROP POLICY IF EXISTS "select_roles" ON user_roles;
DROP POLICY IF EXISTS "modify_roles" ON user_roles;

-- Create simplified policies without recursion
CREATE POLICY "view_user_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "manage_user_roles"
ON user_roles FOR ALL
TO authenticated
USING (
    -- Allow users to manage their own role
    user_id = auth.uid()
    OR
    -- Or if they are a super_admin (direct check)
    (
        SELECT role = 'super_admin'
        FROM user_roles
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);