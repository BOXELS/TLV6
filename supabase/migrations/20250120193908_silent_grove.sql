-- Drop existing policies first
DROP POLICY IF EXISTS "View roles policy" ON user_roles;
DROP POLICY IF EXISTS "Manage roles policy" ON user_roles;
DROP POLICY IF EXISTS "select_user_roles" ON user_roles;
DROP POLICY IF EXISTS "manage_user_roles" ON user_roles;
DROP POLICY IF EXISTS "Basic access policy" ON user_roles;
DROP POLICY IF EXISTS "Role modification policy" ON user_roles;

-- Create new simplified policies
CREATE POLICY "view_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "manage_roles"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- Set specific user as admin
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'jareds.smith@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin';