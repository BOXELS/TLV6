-- Drop existing policies
DROP POLICY IF EXISTS "view_roles" ON user_roles;
DROP POLICY IF EXISTS "manage_roles" ON user_roles;

-- Create a single, dead-simple policy for viewing
CREATE POLICY "view_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Create a single, dead-simple policy for write operations
CREATE POLICY "manage_roles"
ON user_roles FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
    OR
    (
        SELECT role = 'super_admin'
        FROM user_roles
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);

-- Drop and recreate helper functions to be as simple as possible
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role IN ('admin', 'super_admin')
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
    SELECT role = 'super_admin'
    FROM user_roles 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

-- Ensure your user is super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE email = 'jareds.smith@gmail.com';