-- First drop the dependent policies
DROP POLICY IF EXISTS "Allow user details management" ON user_details;
DROP POLICY IF EXISTS "Allow user role management" ON user_roles;

-- Now we can safely drop and recreate the functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;

-- Create simplified admin check that always returns true
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    -- Always return true - all users are admins
    SELECT true;
$$;

-- Create simplified super admin check that always returns true
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    -- Always return true - all users are admins
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
    -- Always return admin
    SELECT 'admin'::text;
$$;

-- Update handle_new_user function to always set admin role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Always insert as admin
    INSERT INTO user_roles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'admin');
    RETURN NEW;
END;
$$;

-- Recreate the policies with the simplified admin check
CREATE POLICY "Allow user details management"
ON user_details FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow user role management"
ON user_roles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);