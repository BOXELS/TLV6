-- Drop existing policies
DROP POLICY IF EXISTS "Allow user details management" ON user_details;
DROP POLICY IF EXISTS "Allow user role management" ON user_roles;
DROP POLICY IF EXISTS "View roles policy" ON user_roles;
DROP POLICY IF EXISTS "Manage roles policy" ON user_roles;

-- Drop existing functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;

-- Create simplified function that always returns true
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT true;
$$;

-- Create simplified function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT 'admin'::text;
$$;

-- Create simplified policies that allow all authenticated users
CREATE POLICY "allow_all_authenticated"
ON user_roles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_authenticated"
ON user_details FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update handle_new_user function to always set admin role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_roles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'admin');
    RETURN NEW;
END;
$$;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Update existing user to admin role
UPDATE user_roles 
SET role = 'admin'
WHERE email = 'jareds.smith@gmail.com';