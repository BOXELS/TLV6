-- Enable RLS on user_types table
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON user_types;
DROP POLICY IF EXISTS "Enable read access for own assignments" ON user_type_assignments;

-- Create a policy that allows all authenticated users to read user types
CREATE POLICY "Enable read access for all users"
ON user_types 
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on user_type_assignments table
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read their own assignments
CREATE POLICY "Enable read access for own assignments"
ON user_type_assignments
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 
    FROM user_type_assignments uta 
    JOIN user_types ut ON ut.id = uta.type_id 
    WHERE uta.user_id = auth.uid() 
    AND ut.code IN ('super_admin', 'admin')
  )
); 