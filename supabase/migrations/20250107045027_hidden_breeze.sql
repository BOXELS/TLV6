-- Add sort_order column to jane_secondary_variants
ALTER TABLE jane_secondary_variants
ADD COLUMN sort_order integer;

-- Update existing records with sequential sort_order
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY parent_id 
    ORDER BY name
  ) - 1 as row_num
  FROM jane_secondary_variants
  WHERE level = 2
)
UPDATE jane_secondary_variants
SET sort_order = numbered_rows.row_num
FROM numbered_rows
WHERE jane_secondary_variants.id = numbered_rows.id;

-- Create index for faster sorting
CREATE INDEX idx_jane_secondary_variants_sort_order 
ON jane_secondary_variants(sort_order);