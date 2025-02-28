-- First, temporarily disable RLS to ensure clean policy removal
ALTER TABLE user_type_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_types DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own type assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "Super admins can manage all type assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "Admins can manage non-admin type assignments" ON user_type_assignments;

-- Re-enable RLS
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for user_type_assignments
CREATE POLICY "Enable read access for authenticated users"
ON user_type_assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON user_type_assignments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policies for user_types table
CREATE POLICY "Enable read access for all users"
ON user_types FOR SELECT
TO authenticated
USING (true);

-- Create policy for super admin management
CREATE POLICY "Super admins can manage all"
ON user_type_assignments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code = 'super_admin'
    )
); 