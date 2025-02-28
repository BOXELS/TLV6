-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Simple policy for users to view their own role
CREATE POLICY "Users can view their own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Simple policy for admins to manage roles
CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'::user_role
    )
);

-- Create function to add admin role
CREATE OR REPLACE FUNCTION add_admin_role(admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::user_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin'::user_role;
END;
$$;