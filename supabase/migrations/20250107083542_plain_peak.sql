-- Improve sort order handling for new mockups
CREATE OR REPLACE FUNCTION maintain_mockup_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the next available sort order for this design
  SELECT COALESCE(MAX(sort_order) + 1, 0)
  INTO NEW.sort_order
  FROM design_mockups
  WHERE design_id = NEW.design_id
  AND NOT is_main;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS set_mockup_sort_order ON design_mockups;

CREATE TRIGGER set_mockup_sort_order
BEFORE INSERT ON design_mockups
FOR EACH ROW
EXECUTE FUNCTION maintain_mockup_sort_order();