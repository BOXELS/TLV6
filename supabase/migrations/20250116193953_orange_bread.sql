-- Drop ALL existing policies and start fresh
DROP POLICY IF EXISTS "View roles" ON user_roles;
DROP POLICY IF EXISTS "Manage roles" ON user_roles;

-- Create a single policy for SELECT that allows:
-- 1. Users to see their own role
-- 2. Everyone to see roles (needed for admin checks)
CREATE POLICY "select_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Create a single policy for INSERT/UPDATE/DELETE
CREATE POLICY "modify_roles"
ON user_roles 
FOR ALL
TO authenticated
USING (
    -- Direct role check without using helper functions
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
        LIMIT 1
    )
);

-- Update helper functions to use direct queries without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
        LIMIT 1
    );
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
        LIMIT 1
    );
$$;

-- Ensure your user is super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Ensure emails are synced
UPDATE user_roles ur
SET email = au.email
FROM auth.users au
WHERE ur.user_id = au.id
AND (ur.email IS NULL OR ur.email != au.email);