-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage non-admin roles" ON user_roles;

-- Create simplified policies without circular dependencies
CREATE POLICY "View own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin view all"
ON user_roles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin'::user_role, 'admin'::user_role)
    )
);

CREATE POLICY "Super admin manage all"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'super_admin'::user_role
    )
);

-- Update is_admin function to avoid recursion
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
        AND role IN ('super_admin'::user_role, 'admin'::user_role)
    );
$$;

-- Update is_super_admin function to avoid recursion
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
        AND role = 'super_admin'::user_role
    );
$$;