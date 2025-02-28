-- Temporarily disable RLS to ensure we can update roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Set specific users as super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE email IN ('jareds.smith@gmail.com', 'jared@boxels.com');

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role text;
BEGIN
    SELECT role::text INTO v_role
    FROM user_roles
    WHERE user_id = $1
    LIMIT 1;
    
    RETURN v_role;
END;
$$;