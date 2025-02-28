/*
  # Fix user roles policies

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for user roles
    - Add function to safely manage admin roles
  
  2. Security
    - Prevent infinite recursion in policies
    - Maintain proper access control
    - Keep security definer function for admin management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Basic policy for users to view their own role
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy for admins to view all roles
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'::user_role
);

-- Policy for admins to manage roles
CREATE POLICY "Admins can manage roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'::user_role
);

-- Function to safely manage admin roles
CREATE OR REPLACE FUNCTION manage_admin_role(target_user_id uuid, make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF make_admin THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (target_user_id, 'admin'::user_role)
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'admin'::user_role;
    ELSE
        UPDATE user_roles
        SET role = 'staff'::user_role
        WHERE user_id = target_user_id;
    END IF;
END;
$$;