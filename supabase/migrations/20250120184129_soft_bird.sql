-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Back up existing roles
CREATE TABLE IF NOT EXISTS user_roles_backup AS 
SELECT * FROM user_roles;

-- Drop problematic tables/views
DROP MATERIALIZED VIEW IF EXISTS user_info;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Create user assignments table
CREATE TABLE user_type_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    type_id uuid REFERENCES user_types ON DELETE RESTRICT,
    assigned_by uuid REFERENCES auth.users,
    assigned_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE(user_id, type_id)
);

-- Enable RLS
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view assignments"
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
        AND ut.code = 'admin'
    )
);

-- Create helper function
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
        AND ut.code = 'admin'
    );
$$;

-- Migrate existing admin users
INSERT INTO user_type_assignments (user_id, type_id, assigned_at)
SELECT 
    ur.user_id,
    ut.id,
    now()
FROM user_roles_backup ur
CROSS JOIN (
    SELECT id FROM user_types WHERE code = 'admin'
) ut
WHERE ur.email IN ('jareds.smith@gmail.com', 'jared@boxels.com');