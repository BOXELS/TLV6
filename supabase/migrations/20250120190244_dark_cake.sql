-- First drop the dependent policies
DROP POLICY IF EXISTS "Allow user details management" ON user_details;
DROP POLICY IF EXISTS "Users can manage own details" ON user_details;

-- Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Create new admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code IN ('admin', 'super_admin')
    );
$$;

-- Recreate the policies that depend on is_admin()
CREATE POLICY "Allow user details management"
ON user_details FOR ALL
TO authenticated
USING (
    id = auth.uid() 
    OR EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code IN ('admin', 'super_admin')
    )
);

-- Create function to get user type
CREATE OR REPLACE FUNCTION get_user_type(user_id uuid)
RETURNS TABLE (
    type_code text,
    organization_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.code::text,
        uta.organization_id
    FROM user_type_assignments uta
    JOIN user_types ut ON uta.type_id = ut.id
    WHERE uta.user_id = $1;
END;
$$;