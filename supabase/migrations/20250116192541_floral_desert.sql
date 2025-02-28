-- Drop existing policies
DROP POLICY IF EXISTS "View roles policy" ON user_roles;
DROP POLICY IF EXISTS "Manage roles policy" ON user_roles;
DROP POLICY IF EXISTS "Update roles policy" ON user_roles;

-- Create a single, simple policy for viewing
CREATE POLICY "View roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Create a single policy for all write operations
CREATE POLICY "Manage roles"
ON user_roles FOR ALL
TO authenticated
USING (
    -- Users can manage their own role
    user_id = auth.uid()
    OR
    -- Or they are a super_admin
    (
        SELECT role::text = 'super_admin' 
        FROM user_roles 
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);

-- Update helper functions to be simpler and avoid recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role::text IN ('admin', 'super_admin')
    FROM user_roles 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role::text = 'super_admin'
    FROM user_roles 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

-- Add index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
ON user_roles(user_id, role);

-- Ensure your specific user has super_admin role
UPDATE user_roles 
SET role = 'super_admin'
WHERE user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8';