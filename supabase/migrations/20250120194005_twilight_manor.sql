-- Drop existing functions
DROP FUNCTION IF EXISTS get_user_type(uuid);
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_super_admin();

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS TABLE (role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT ur.role::text
    FROM user_roles ur
    WHERE ur.user_id = p_user_id;
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
        AND role IN ('admin', 'super_admin')
    );
$$;

-- Create function to check super admin status
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
        AND role = 'super_admin'
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
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users 
WHERE email = 'jareds.smith@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET role = 'super_admin';