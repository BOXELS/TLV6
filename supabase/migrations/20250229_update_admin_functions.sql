-- Drop existing functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;

-- Create new admin check function that uses user_types
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

-- Update RLS policies to use new user types system
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own type assignments"
ON user_type_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all type assignments"
ON user_type_assignments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code = 'super_admin'
    )
);

CREATE POLICY "Admins can manage non-admin type assignments"
ON user_type_assignments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code = 'admin'
    )
    AND NOT EXISTS (
        SELECT 1 
        FROM user_types ut2
        WHERE ut2.id = user_type_assignments.type_id
        AND ut2.code IN ('admin', 'super_admin')
    )
); 