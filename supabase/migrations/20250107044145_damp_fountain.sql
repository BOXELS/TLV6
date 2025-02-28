/*
  # Add RLS policies for Jane tables
  
  1. New Policies
    - Enable RLS on all Jane-related tables
    - Add admin-only management policies
    - Add read-only policies for authenticated users
  
  2. Security
    - Only admins can manage (create/update/delete) records
    - All authenticated users can view records
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow read access to jane tables" ON jane_categories;
DROP POLICY IF EXISTS "Allow read access to jane tables" ON jane_primary_variants;
DROP POLICY IF EXISTS "Allow read access to jane tables" ON jane_secondary_variants;

-- Create policies for jane_categories
CREATE POLICY "Authenticated users can view jane categories"
ON jane_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage jane categories"
ON jane_categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Create policies for jane_primary_variants
CREATE POLICY "Authenticated users can view jane primary variants"
ON jane_primary_variants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage jane primary variants"
ON jane_primary_variants FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Create policies for jane_secondary_variants
CREATE POLICY "Authenticated users can view jane secondary variants"
ON jane_secondary_variants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage jane secondary variants"
ON jane_secondary_variants FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);