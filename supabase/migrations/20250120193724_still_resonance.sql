-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_type(uuid);
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_super_admin();

-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_type_assignments CASCADE;
DROP TABLE IF EXISTS user_types CASCADE;

-- Create simple user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    role text NOT NULL DEFAULT 'user',
    email text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "View roles policy"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Manage roles policy"
ON user_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT role
        FROM user_roles
        WHERE user_id = p_user_id
        LIMIT 1
    );
END;
$$;

-- Create function to check admin status
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
        AND role = 'admin'
    );
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert new user with admin role if first user, otherwise regular user
    INSERT INTO user_roles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM user_roles) THEN 'admin'
            ELSE 'user'
        END
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

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