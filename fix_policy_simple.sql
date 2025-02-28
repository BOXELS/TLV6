-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable read access for own assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "User type assignments viewable by authenticated users" ON user_type_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "Super admins can manage all" ON user_type_assignments;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON user_type_assignments;
DROP POLICY IF EXISTS "user_type_assignments_select_policy" ON user_type_assignments;
DROP POLICY IF EXISTS "user_type_assignments_admin_policy" ON user_type_assignments;

-- Create a single simple policy for reading
CREATE POLICY "temp_allow_all_reads"
ON user_type_assignments
FOR SELECT 
TO authenticated
USING (true);

-- Verify the assignment exists
SELECT 
    uta.id as assignment_id,
    uta.user_id,
    ut.id as type_id,
    ut.name as type_name,
    ut.code as type_code
FROM user_type_assignments uta
JOIN user_types ut ON ut.id = uta.type_id
WHERE uta.user_id = '4259afda-05ff-4679-aae2-fb87ccbdfea8'; 