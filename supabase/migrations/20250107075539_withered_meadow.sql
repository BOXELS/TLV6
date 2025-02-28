/*
  # Add mockup management functions
  
  1. Changes
    - Add function to set main mockup
    - Add function to reorder mockups
    - Add trigger to maintain sort order
*/

-- Create function to set main mockup
CREATE OR REPLACE FUNCTION set_main_mockup(
  p_mockup_id uuid,
  p_design_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First unset any existing main image
  UPDATE design_mockups
  SET is_main = false
  WHERE design_id = p_design_id;
  
  -- Set new main image
  UPDATE design_mockups
  SET is_main = true,
      sort_order = -1 -- Ensure main image is always first
  WHERE id = p_mockup_id;
  
  -- Reorder remaining mockups
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (
      ORDER BY 
        CASE WHEN id = p_mockup_id THEN -1 
        ELSE sort_order END
    ) - 1 as new_order
    FROM design_mockups
    WHERE design_id = p_design_id
  )
  UPDATE design_mockups m
  SET sort_order = n.new_order
  FROM numbered n
  WHERE m.id = n.id;
END;
$$;