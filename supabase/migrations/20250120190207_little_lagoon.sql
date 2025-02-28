-- Drop old user_roles related functions
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS get_user_type(uuid);
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_super_admin();

-- Create new function to get user types
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

-- Create new super admin check function
CREATE OR REPLACE FUNCTION is_super_admin()
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
        AND ut.code = 'super_admin'
    );
$$;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_user_type_assignments_user_id 
ON user_type_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_type_assignments_type_id 
ON user_type_assignments(type_id);

CREATE INDEX IF NOT EXISTS idx_user_types_code 
ON user_types(code);