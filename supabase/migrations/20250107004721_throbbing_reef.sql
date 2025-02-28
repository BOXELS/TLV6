/*
  # Update Secondary Variants Data

  Updates the custom labels and abbreviations for existing secondary variants
  to match the standardized format.
*/

-- Update existing records with default values
UPDATE jane_secondary_variants
SET 
    custom_label = CASE 
        WHEN name = 'X-Small' THEN 'XS'
        WHEN name = 'Small' THEN 'S'
        WHEN name = 'Medium' THEN 'M'
        WHEN name = 'Large' THEN 'L'
        WHEN name = 'XL' THEN 'XL'
        WHEN name = 'XXL' THEN '2XL'
        WHEN name = 'XXXL' THEN '3XL'
        WHEN name = 'S-M' THEN 'S-M'
        WHEN name = 'L-XL' THEN 'L-XL'
        WHEN name = 'One Size Fits Most' THEN 'OS'
        WHEN name = 'XS-S' THEN 'XS-S'
        WHEN name = 'M-L' THEN 'M-L'
        WHEN name = 'XL-2XL' THEN 'XL-2XL'
        WHEN name = '1X' THEN '1X'
        WHEN name = '2X' THEN '2X'
        WHEN name = '3X' THEN '3X'
        ELSE name
    END,
    abbreviation = CASE 
        WHEN name = 'X-Small' THEN 'XS'
        WHEN name = 'Small' THEN 'S'
        WHEN name = 'Medium' THEN 'M'
        WHEN name = 'Large' THEN 'L'
        WHEN name = 'XL' THEN 'XL'
        WHEN name = 'XXL' THEN '2XL'
        WHEN name = 'XXXL' THEN '3XL'
        WHEN name = 'S-M' THEN 'S-M'
        WHEN name = 'L-XL' THEN 'L-XL'
        WHEN name = 'One Size Fits Most' THEN 'OS'
        WHEN name = 'XS-S' THEN 'XS-S'
        WHEN name = 'M-L' THEN 'M-L'
        WHEN name = 'XL-2XL' THEN 'XL-2XL'
        WHEN name = '1X' THEN '1X'
        WHEN name = '2X' THEN '2X'
        WHEN name = '3X' THEN '3X'
        ELSE name
    END
WHERE level = 2;