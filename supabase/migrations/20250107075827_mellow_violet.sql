/*
  # Fix design mockups RLS policies
  
  1. Changes
    - Drop existing policies
    - Create new policies with proper permissions for sort order and main image updates
    - Add security definer function for updating mockups
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Mockups are viewable by authenticated users" ON design_mockups;
DROP POLICY IF EXISTS "Users can manage their own mockups" ON design_mockups;

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
);

-- Create function to update mockup order
CREATE OR REPLACE FUNCTION update_mockup_order(
  p_mockup_ids uuid[],
  p_design_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user owns the design
  IF NOT EXISTS (
    SELECT 1 FROM design_files
    WHERE id = p_design_id
    AND uploaded_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update sort order
  FOR i IN 1..array_length(p_mockup_ids, 1)
  LOOP
    UPDATE design_mockups
    SET sort_order = i - 1
    WHERE id = p_mockup_ids[i]
    AND design_id = p_design_id;
  END LOOP;
END;
$$;