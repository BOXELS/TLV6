-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can create initial user role" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can create initial user details" ON user_details;
DROP POLICY IF EXISTS "Users can view own details" ON user_details;
DROP POLICY IF EXISTS "Users can update own details" ON user_details;
DROP POLICY IF EXISTS "Admins can delete user details" ON user_details;

-- Create improved admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- First user is always admin
  IF NOT EXISTS (SELECT 1 FROM user_roles) THEN
    RETURN TRUE;
  END IF;

  -- Check if current user is admin
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::user_role
  );
END;
$$;

-- Create new policies for user_roles
CREATE POLICY "Allow user role management"
ON user_roles FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create new policies for user_details
CREATE POLICY "Allow user details management"
ON user_details FOR ALL
USING (is_admin() OR id = auth.uid())
WITH CHECK (is_admin() OR id = auth.uid());