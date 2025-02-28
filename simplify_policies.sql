-- First, let's see all current policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND (tablename = 'user_type_assignments' OR tablename = 'user_types');

-- Now let's simplify everything
-- First, drop all existing policies
DROP POLICY IF EXISTS "users_read_own_assignments" ON user_type_assignments;
DROP POLICY IF EXISTS "super_admin_read_all" ON user_type_assignments;
DROP POLICY IF EXISTS "user_type_assignments_select_policy" ON user_type_assignments;
DROP POLICY IF EXISTS "user_type_assignments_admin_policy" ON user_type_assignments;

-- For user_types table
DROP POLICY IF EXISTS "Enable read access for all" ON user_types;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON user_types;

-- Create simple policies
-- 1. Anyone authenticated can read user_types
CREATE POLICY "allow_read_user_types"
ON user_types
FOR SELECT
TO authenticated
USING (true);

-- 2. Users can read their own assignments
CREATE POLICY "allow_read_own_assignments"
ON user_type_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Let's also modify our query approach in the app to be simpler:
-- Instead of a nested select, we'll do:
SELECT 
    uta.type_id,
    ut.id,
    ut.name,
    ut.code,
    ut.can_manage_users,
    ut.can_manage_admins,
    ut.can_manage_vendors,
    ut.can_manage_designers,
    ut.can_manage_staff
FROM user_type_assignments uta
JOIN user_types ut ON ut.id = uta.type_id
WHERE uta.user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8'; 