/*
  # Fix user roles policies recursion

  1. Changes
    - Drop existing policies that cause recursion
    - Create new non-recursive policies using direct role checks
    - Add function to safely check admin status
  
  2. Security
    - Prevent infinite recursion in policies
    - Maintain proper access control
    - Add security definer function for admin checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Create function to safely check admin status
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id
    AND role = 'admin'::user_role
  );
$$;

-- Basic policy for users to view their own role
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy for admins to view all roles
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Policy for admins to insert roles
CREATE POLICY "Admins can insert roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Policy for admins to update roles
CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Policy for admins to delete roles
CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));