-- Drop existing policies
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON categories;
DROP POLICY IF EXISTS "Categories can be created by authenticated users" ON categories;

-- Create proper RLS policies
CREATE POLICY "Categories are viewable by authenticated users"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'::user_role
    )
);