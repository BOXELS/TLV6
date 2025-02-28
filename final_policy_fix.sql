-- Drop ALL policies from both tables
DROP POLICY IF EXISTS "allow_read_user_types" ON user_types;
DROP POLICY IF EXISTS "allow_read_own_assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "users_read_own_assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "super_admin_read_all" ON user_type_assignments;
DROP POLICY IF EXISTS "user_type_assignments_select_policy" ON user_type_assignments;
DROP POLICY IF EXISTS "user_type_assignments_admin_policy" ON user_type_assignments;

-- Disable RLS on user_types (make it readable by all authenticated users)
ALTER TABLE user_types DISABLE ROW LEVEL SECURITY;

-- Enable RLS on user_type_assignments with one simple policy
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "basic_read_policy"
ON user_type_assignments
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id
);

-- Verify our data is correct
SELECT * FROM user_types;
SELECT * FROM user_type_assignments WHERE user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8'; 