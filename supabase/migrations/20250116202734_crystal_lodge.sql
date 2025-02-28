-- Temporarily disable RLS to ensure we can fix roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE design_files DISABLE ROW LEVEL SECURITY;

-- Ensure super_admin role exists for specific users
UPDATE user_roles 
SET role = 'super_admin'
WHERE email IN ('jareds.smith@gmail.com', 'jared@boxels.com');

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON categories;
DROP POLICY IF EXISTS "Design files are viewable by authenticated users" ON design_files;

-- Create simplified policies for categories
CREATE POLICY "authenticated_select_categories"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_manage_categories"
ON categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- Create simplified policies for design_files
CREATE POLICY "authenticated_select_designs"
ON design_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "owner_manage_designs"
ON design_files FOR ALL
TO authenticated
USING (
    uploaded_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- Create function to check user access level
CREATE OR REPLACE FUNCTION check_user_access(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND (
            CASE 
                WHEN required_role = 'super_admin' THEN role = 'super_admin'
                WHEN required_role = 'admin' THEN role IN ('admin', 'super_admin')
                ELSE true
            END
        )
    );
END;
$$;