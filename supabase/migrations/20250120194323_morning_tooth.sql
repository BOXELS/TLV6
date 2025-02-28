-- Drop existing policies
DROP POLICY IF EXISTS "view_roles" ON user_roles;
DROP POLICY IF EXISTS "manage_roles" ON user_roles;

-- Create a single, simple policy for viewing
CREATE POLICY "view_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Create a single policy for write operations
CREATE POLICY "manage_roles"
ON user_roles FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
    OR
    (
        SELECT role = 'super_admin'
        FROM user_roles
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);

-- Drop and recreate helper functions to be as simple as possible
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role IN ('admin', 'super_admin')
    FROM user_roles 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role = 'super_admin'
    FROM user_roles 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role::text
    FROM user_roles
    WHERE user_id = p_user_id
    LIMIT 1;
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert new user with appropriate role
    INSERT INTO user_roles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM user_roles) THEN 'super_admin'
            ELSE 'user'
        END
    );
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- Set specific user as super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE email = 'jareds.smith@gmail.com';