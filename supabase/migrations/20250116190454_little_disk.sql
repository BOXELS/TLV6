-- Drop unused tables
DROP TABLE IF EXISTS user_type_assignments CASCADE;
DROP TABLE IF EXISTS user_relationships CASCADE;
DROP TABLE IF EXISTS user_types CASCADE;

-- Update user_role enum to include all required types
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';

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
    AND NEW.role NOT IN ('super_admin', 'admin')
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
    AND NEW.role NOT IN ('super_admin', 'admin')
);