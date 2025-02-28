-- First, drop all existing policies on user_type_assignments
DROP POLICY IF EXISTS "Anyone can view assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable read access for own assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "User type assignments viewable by authenticated users" ON user_type_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "Super admins can manage all" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON user_type_assignments;

-- Create a single, simple read policy
CREATE POLICY "user_type_assignments_select_policy"
ON user_type_assignments
FOR SELECT
TO authenticated
USING (
  -- Users can see their own assignments
  user_id = auth.uid()
);

-- Create a policy for super_admin management
CREATE POLICY "user_type_assignments_admin_policy"
ON user_type_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_type_assignments uta
    JOIN user_types ut ON ut.id = uta.type_id
    WHERE uta.user_id = auth.uid()
    AND ut.code = 'super_admin'
  )
); 