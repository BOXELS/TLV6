-- Add new columns to jane_secondary_variants
ALTER TABLE jane_secondary_variants
ADD COLUMN custom_label text,
ADD COLUMN abbreviation text,
ADD COLUMN weight_oz decimal(10,2),
ADD COLUMN price decimal(10,2);

-- Update existing records with default values
UPDATE jane_secondary_variants
SET 
    custom_label = CASE 
        WHEN name = 'Small' THEN 'S'
        WHEN name = 'Medium' THEN 'M'
        WHEN name = 'Large' THEN 'L'
        WHEN name = 'XL' THEN 'XL'
        WHEN name = 'XXL' THEN '2XL'
        WHEN name = 'XXXL' THEN '3XL'
        ELSE name
    END,
    abbreviation = CASE 
        WHEN name = 'Small' THEN 'S'
        WHEN name = 'Medium' THEN 'M'
        WHEN name = 'Large' THEN 'L'
        WHEN name = 'XL' THEN 'XL'
        WHEN name = 'XXL' THEN '2XL'
        WHEN name = 'XXXL' THEN '3XL'
        ELSE name
    END,
    weight_oz = CASE 
        WHEN name = 'Small' THEN 6.08
        WHEN name = 'Medium' THEN 7.04
        WHEN name = 'Large' THEN 8.00
        WHEN name = 'XL' THEN 8.96
        WHEN name = 'XXL' THEN 8.96
        WHEN name = 'XXXL' THEN 10.08
        ELSE 8.00
    END,
    price = CASE 
        WHEN name = 'XXL' THEN 32.99
        WHEN name = 'XXXL' THEN 34.99
        ELSE 29.99
    END
WHERE level = 2;