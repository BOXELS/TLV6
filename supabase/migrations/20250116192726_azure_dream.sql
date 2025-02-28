-- Drop existing policies
DROP POLICY IF EXISTS "View roles" ON user_roles;
DROP POLICY IF EXISTS "Manage roles" ON user_roles;

-- Create a single, simple policy for viewing
CREATE POLICY "View all roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Create a single policy for write operations
CREATE POLICY "Manage roles"
ON user_roles FOR ALL
TO authenticated
USING (
    -- Only super_admins can modify roles
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
        LIMIT 1
    )
);

-- Update helper functions to be as simple as possible
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

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Set your user as super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8';