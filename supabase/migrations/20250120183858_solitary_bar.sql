-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Update any existing super_admin roles to admin
UPDATE user_roles
SET role = 'admin'
WHERE role::text = 'super_admin';

-- Update specific users to admin role
UPDATE user_roles 
SET role = 'admin'
WHERE email IN ('jareds.smith@gmail.com', 'jared@boxels.com');

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Update helper functions to use admin instead of super_admin
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
        AND role = 'admin'
        LIMIT 1
    );
$$;