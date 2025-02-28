/*
  # Fix User Management Policies

  1. Updates
    - Fixes RLS policies for user_roles and user_details tables
    - Adds proper admin checks
    - Ensures new users can be created properly
  
  2. Security
    - Maintains proper access control
    - Only allows admins to manage users
    - Allows users to view their own details
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own details" ON user_details;
DROP POLICY IF EXISTS "Admins can view all user details" ON user_details;
DROP POLICY IF EXISTS "Admins can manage user details" ON user_details;

-- Create function to check if a user is an admin
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
    AND role = 'admin'::user_role
  );
$$;

-- Policies for user_roles
CREATE POLICY "Anyone can create initial user role"
ON user_roles FOR INSERT
WITH CHECK (
  -- Allow insert if table is empty (first user)
  NOT EXISTS (SELECT 1 FROM user_roles)
  -- Or if user is admin
  OR is_admin()
);

CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
USING (is_admin());

-- Policies for user_details
CREATE POLICY "Anyone can create initial user details"
ON user_details FOR INSERT
WITH CHECK (
  -- Allow insert if table is empty (first user)
  NOT EXISTS (SELECT 1 FROM user_details)
  -- Or if user is admin
  OR is_admin()
  -- Or if user is creating their own details
  OR id = auth.uid()
);

CREATE POLICY "Users can view own details"
ON user_details FOR SELECT
USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own details"
ON user_details FOR UPDATE
USING (id = auth.uid() OR is_admin())
WITH CHECK (id = auth.uid() OR is_admin());

CREATE POLICY "Admins can delete user details"
ON user_details FOR DELETE
USING (is_admin());