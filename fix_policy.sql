-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for own assignments" ON user_type_assignments;

-- Create a simpler policy for user_type_assignments
CREATE POLICY "Enable read access for assignments"
ON user_type_assignments
FOR SELECT
TO authenticated
USING (true);  -- Temporarily allow all authenticated users to read assignments

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_type_assignments'; 