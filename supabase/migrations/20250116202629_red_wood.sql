-- Drop existing policies
DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;

-- Create function to check super admin status
CREATE OR REPLACE FUNCTION is_super_admin_check()
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

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TABLE (role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT ur.role::text
    FROM user_roles ur
    WHERE ur.user_id = $1;
END;
$$;

-- Create policies for user_roles table
CREATE POLICY "super_admin_full_access"
ON user_roles
FOR ALL
TO authenticated
USING (is_super_admin_check())
WITH CHECK (is_super_admin_check());

CREATE POLICY "users_view_own_role"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
ON user_roles(user_id, role);

-- Update any existing users to have super_admin role
UPDATE user_roles
SET role = 'super_admin'
WHERE email IN (
    'jared@boxels.com',
    'jareds.smith@gmail.com'
);