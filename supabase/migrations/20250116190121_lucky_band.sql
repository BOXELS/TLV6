-- Drop unused tables
DROP TABLE IF EXISTS user_type_assignments CASCADE;
DROP TABLE IF EXISTS user_relationships CASCADE;
DROP TABLE IF EXISTS user_types CASCADE;

-- Update user_role enum to include all required types
DO $$ 
BEGIN
    -- First check if the values exist to avoid errors
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'vendor', 'designer', 'staff', 'user');
    ELSE
        -- Add new values if they don't exist
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
        
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- Drop unused columns from user_roles if they exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'can_manage_users'
    ) THEN
        ALTER TABLE user_roles 
        DROP COLUMN IF EXISTS can_manage_users,
        DROP COLUMN IF EXISTS can_manage_admins,
        DROP COLUMN IF EXISTS can_manage_vendors,
        DROP COLUMN IF EXISTS can_manage_designers,
        DROP COLUMN IF EXISTS can_manage_staff;
    END IF;
END $$;

-- Update existing admin users to super_admin
UPDATE user_roles
SET role = 'super_admin'::user_role
WHERE role = 'admin';

-- Update RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage non-admin roles" ON user_roles;

CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    )
);

CREATE POLICY "Super admins can manage all roles"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

CREATE POLICY "Admins can manage non-admin roles"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
    AND (
        SELECT role FROM user_roles WHERE user_id = user_roles.user_id
    ) NOT IN ('super_admin', 'admin')
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
    AND NEW.role NOT IN ('super_admin', 'admin')
);

-- Update is_admin function to handle both admin types
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    );
END;
$$;

-- Add new function to check super admin status
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    );
END;
$$;

COMMENT ON FUNCTION is_admin() IS 'Checks if the current user has admin or super_admin role';
COMMENT ON FUNCTION is_super_admin() IS 'Checks if the current user has super_admin role';