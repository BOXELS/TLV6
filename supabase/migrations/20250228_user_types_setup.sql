-- First, backup existing roles
CREATE TABLE IF NOT EXISTS user_roles_backup AS 
SELECT * FROM user_roles;

-- Drop the user_role type after backup (this will also drop the user_roles table)
DROP TYPE IF EXISTS user_role CASCADE;

-- Create user_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text NOT NULL UNIQUE,
    can_manage_users boolean DEFAULT false,
    can_manage_admins boolean DEFAULT false,
    can_manage_vendors boolean DEFAULT false,
    can_manage_designers boolean DEFAULT false,
    can_manage_staff boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create user_type_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_type_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    type_id uuid REFERENCES user_types ON DELETE RESTRICT,
    assigned_by uuid REFERENCES auth.users,
    assigned_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE(user_id, type_id)
);

-- Insert default user types
INSERT INTO user_types (name, code, can_manage_users, can_manage_admins, can_manage_vendors, can_manage_designers, can_manage_staff)
VALUES 
    ('Super Admin', 'super_admin', true, true, true, true, true),
    ('Admin', 'admin', true, false, true, true, true),
    ('Staff', 'staff', false, false, false, false, false),
    ('Vendor', 'vendor', false, false, false, false, false),
    ('Designer', 'designer', false, false, false, false, false),
    ('User', 'user', false, false, false, false, false)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for user_types
CREATE POLICY "Anyone can view user types"
ON user_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only super admins can modify user types"
ON user_types FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code = 'super_admin'
    )
);

-- Create policies for user_type_assignments
CREATE POLICY "Anyone can view assignments"
ON user_type_assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage assignments"
ON user_type_assignments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code IN ('admin', 'super_admin')
    )
);

-- Create helper functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code IN ('admin', 'super_admin')
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
        SELECT 1 FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code = 'super_admin'
    );
$$;

-- Migrate existing users from user_roles_backup to user_type_assignments
INSERT INTO user_type_assignments (user_id, type_id, assigned_at)
SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    (SELECT id FROM user_types WHERE code = 'admin'),
    ur.created_at
FROM user_roles_backup ur
ON CONFLICT (user_id, type_id) DO NOTHING;

-- Ensure jareds.smith@gmail.com is super_admin
WITH super_admin_type AS (
    SELECT id FROM user_types WHERE code = 'super_admin'
),
target_user AS (
    SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'
)
INSERT INTO user_type_assignments (user_id, type_id)
SELECT 
    target_user.id,
    super_admin_type.id
FROM target_user, super_admin_type
ON CONFLICT (user_id, type_id) DO UPDATE 
SET assigned_at = now();

-- Clean up: drop the backup table
DROP TABLE IF EXISTS user_roles_backup; 