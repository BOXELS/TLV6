-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TABLE (
    role text
)
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

-- Create function to get user type (alias for backward compatibility)
CREATE OR REPLACE FUNCTION get_user_type(user_id uuid)
RETURNS TABLE (
    role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT get_user_role($1);
END;
$$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- Ensure your user has admin role
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email IN ('jareds.smith@gmail.com', 'jared@boxels.com')
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin';