/*
  # Update design mockups RLS policies
  
  1. Changes
    - Drop existing policies
    - Create new policies that allow updating sort_order and is_main
    - Add proper security checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Mockups are viewable by authenticated users" ON design_mockups;
DROP POLICY IF EXISTS "Users can manage mockups for their designs" ON design_mockups;

-- Create new policies
CREATE POLICY "Mockups are viewable by authenticated users"
ON design_mockups FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM design_files
  WHERE id = design_id
));

CREATE POLICY "Users can manage their own mockups"
ON design_mockups FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM design_files
    WHERE id = design_id
    AND uploaded_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM design_files
    WHERE id = design_id
    AND uploaded_by = auth.uid()
  )
);