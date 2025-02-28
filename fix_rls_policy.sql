-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "temp_allow_all_reads" ON user_type_assignments;
DROP POLICY IF EXISTS "Anyone can view assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable read access for own assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "User type assignments viewable by authenticated users" ON user_type_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "Super admins can manage all" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON user_type_assignments;

-- Enable RLS
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for users to read their own assignments
CREATE POLICY "users_read_own_assignments"
ON user_type_assignments
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id
);

-- Create a policy for super admins to read all assignments
CREATE POLICY "super_admin_read_all"
ON user_type_assignments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON ut.id = uta.type_id
        WHERE uta.user_id = auth.uid()
        AND ut.code = 'super_admin'
    )
);

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'user_type_assignments'; 