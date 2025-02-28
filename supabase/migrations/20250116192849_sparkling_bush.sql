-- Drop ALL existing policies
DROP POLICY IF EXISTS "View all roles" ON user_roles;
DROP POLICY IF EXISTS "Manage roles" ON user_roles;
DROP POLICY IF EXISTS "Basic access policy" ON user_roles;
DROP POLICY IF EXISTS "Role modification policy" ON user_roles;

-- Create a single, dead-simple policy for viewing
CREATE POLICY "View roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Create a single, dead-simple policy for write operations
CREATE POLICY "Manage roles"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
        LIMIT 1
    )
);

-- Simplify helper functions to absolute minimum
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