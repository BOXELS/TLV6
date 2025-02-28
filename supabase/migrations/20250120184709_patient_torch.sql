-- Drop existing user types and recreate with correct structure
DROP TABLE IF EXISTS user_type_assignments CASCADE;
DROP TABLE IF EXISTS user_types CASCADE;

-- Create user types table with proper types
CREATE TABLE user_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_type_code CHECK (code IN ('super_admin', 'admin', 'vendor', 'designer', 'staff', 'user'))
);

-- Create user type assignments table
CREATE TABLE user_type_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    type_id uuid REFERENCES user_types ON DELETE RESTRICT,
    organization_id uuid, -- For staff members assigned to vendors
    assigned_by uuid REFERENCES auth.users,
    assigned_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE(user_id, type_id)
);

-- Enable RLS
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view user types"
ON user_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only super admins can manage user types"
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

CREATE POLICY "Users can view assignments"
ON user_type_assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage all assignments"
ON user_type_assignments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code = 'super_admin'
    )
);

-- Insert base user types
INSERT INTO user_types (name, code, description) VALUES
    ('Super Admin', 'super_admin', 'Full system access and control'),
    ('Admin', 'admin', 'System administration access'),
    ('Vendor', 'vendor', 'Business account with vendor tools'),
    ('Designer', 'designer', 'Vendor with designer tool access'),
    ('Staff', 'staff', 'Staff member assigned to a vendor'),
    ('User', 'user', 'Standard user account');

-- Get super admin type ID
WITH super_admin_type AS (
    SELECT id FROM user_types WHERE code = 'super_admin'
)
-- Assign super admin type to specific users
INSERT INTO user_type_assignments (user_id, type_id, assigned_at)
SELECT 
    au.id as user_id,
    sat.id as type_id,
    now() as assigned_at
FROM auth.users au
CROSS JOIN super_admin_type sat
WHERE au.email IN ('jareds.smith@gmail.com', 'jared@boxels.com')
ON CONFLICT (user_id, type_id) DO NOTHING;

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