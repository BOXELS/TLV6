/*
  # Add mockup sorting and main image functionality
  
  1. Changes
    - Add sort_order column to design_mockups
    - Add is_main column to design_mockups
    - Add index for faster sorting
    - Add trigger to maintain sort order
    - Add function to update main image
*/

-- Add new columns
ALTER TABLE design_mockups
ADD COLUMN sort_order integer DEFAULT 0,
ADD COLUMN is_main boolean DEFAULT false;

-- Create index for faster sorting
CREATE INDEX idx_design_mockups_sort_order 
ON design_mockups(design_id, sort_order);

-- Create function to maintain sort order
CREATE OR REPLACE FUNCTION maintain_mockup_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  -- If no sort_order specified, put at end
  IF NEW.sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order) + 1, 0)
    INTO NEW.sort_order
    FROM design_mockups
    WHERE design_id = NEW.design_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sort order
CREATE TRIGGER set_mockup_sort_order
BEFORE INSERT ON design_mockups
FOR EACH ROW
EXECUTE FUNCTION maintain_mockup_sort_order();

-- Create function to update main image
CREATE OR REPLACE FUNCTION set_main_mockup(
  p_mockup_id uuid,
  p_design_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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