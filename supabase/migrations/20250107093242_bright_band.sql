-- Drop existing policies
DROP POLICY IF EXISTS "Design files are viewable by authenticated users" ON design_files;
DROP POLICY IF EXISTS "Users can create their own design files" ON design_files;
DROP POLICY IF EXISTS "Users can update their own design files" ON design_files;

-- Create new policies with proper delete permissions
CREATE POLICY "Design files are viewable by authenticated users"
ON design_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own design files"
ON design_files FOR ALL
TO authenticated
USING (
  uploaded_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);