-- First update any existing super_admin roles to admin temporarily
UPDATE user_roles
SET role = 'admin'
WHERE role = 'super_admin';

-- Drop and recreate the enum with correct values
DROP TYPE user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'vendor', 'designer', 'user');

-- Recreate the user_roles table
CREATE TABLE user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    email text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "select_user_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "manage_user_roles"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Set specific users as admin
UPDATE user_roles 
SET role = 'admin'
WHERE email IN ('jareds.smith@gmail.com', 'jared@boxels.com');