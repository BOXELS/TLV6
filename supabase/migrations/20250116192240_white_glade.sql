-- Drop existing policies
DROP POLICY IF EXISTS "View roles policy" ON user_roles;
DROP POLICY IF EXISTS "Manage roles policy" ON user_roles;
DROP POLICY IF EXISTS "Update roles policy" ON user_roles;

-- Create new policies with proper checks
CREATE POLICY "View roles policy"
ON user_roles FOR SELECT
TO authenticated
USING (
    -- Users can view their own role
    user_id = auth.uid()
    OR 
    -- Admins and super_admins can view all roles
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role::text IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Manage roles policy"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
    -- Only super_admins can create new roles
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role::text = 'super_admin'
    )
);

CREATE POLICY "Update roles policy"
ON user_roles FOR UPDATE
TO authenticated
USING (
    -- Super admins can update any role
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role::text = 'super_admin'
    )
    OR
    -- Regular admins can only update non-admin roles
    (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role::text = 'admin'
        )
        AND (
            SELECT role::text FROM user_roles 
            WHERE user_id = user_roles.user_id
        ) NOT IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    -- Super admins can set any role
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role::text = 'super_admin'
    )
    OR
    -- Regular admins can only set non-admin roles
    (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role::text = 'admin'
        )
        AND NEW.role::text NOT IN ('admin', 'super_admin')
    )
);

-- Update helper functions to be more efficient
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
        AND role::text IN ('admin', 'super_admin')
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
        AND role::text = 'super_admin'
    );
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
ON user_roles(user_id, role);

-- Ensure your specific user has super_admin role
UPDATE user_roles 
SET role = 'super_admin'
WHERE user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8';