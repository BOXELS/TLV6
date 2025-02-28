-- Drop all existing policies
DROP POLICY IF EXISTS "View own role" ON user_roles;
DROP POLICY IF EXISTS "Admin view all" ON user_roles;
DROP POLICY IF EXISTS "Super admin manage all" ON user_roles;

-- Create a single, simple policy for viewing
CREATE POLICY "Basic access policy"
ON user_roles FOR SELECT
TO authenticated
USING (
    -- Users can always view their own role
    user_id = auth.uid()
    OR
    -- Or if they are an admin/super_admin (direct check without recursion)
    (SELECT role IN ('admin', 'super_admin') FROM user_roles WHERE user_id = auth.uid())
);

-- Create a single, simple policy for modifications
CREATE POLICY "Role modification policy"
ON user_roles FOR ALL
TO authenticated
USING (
    -- Only super_admins can modify roles (direct check without recursion)
    (SELECT role = 'super_admin' FROM user_roles WHERE user_id = auth.uid())
)
WITH CHECK (
    -- Only super_admins can modify roles (direct check without recursion)
    (SELECT role = 'super_admin' FROM user_roles WHERE user_id = auth.uid())
);

-- Update helper functions to be simpler and avoid any potential recursion
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
    );
$$;

-- Ensure your role is set to super_admin
UPDATE user_roles
SET role = 'super_admin'
WHERE user_id = auth.uid();