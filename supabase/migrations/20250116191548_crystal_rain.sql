-- Update your specific user to super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8';

-- Drop existing policies
DROP POLICY IF EXISTS "Basic access policy" ON user_roles;
DROP POLICY IF EXISTS "Role modification policy" ON user_roles;

-- Create simplified policies
CREATE POLICY "View roles policy"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Manage roles policy"
ON user_roles FOR ALL
TO authenticated
USING (
    user_id = auth.uid() 
    OR role = 'super_admin'
);

-- Update helper functions
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