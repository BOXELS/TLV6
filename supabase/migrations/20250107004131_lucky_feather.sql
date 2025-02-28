-- First clear existing data
TRUNCATE TABLE jane_secondary_variants CASCADE;

-- Insert Generic US as main category
WITH inserted_generic_us AS (
    INSERT INTO jane_secondary_variants (name, level)
    VALUES ('Generic US', 1)
    RETURNING id
)
-- Insert size variants
INSERT INTO jane_secondary_variants (
    name, 
    parent_id, 
    level, 
    custom_label, 
    abbreviation, 
    weight_oz, 
    price
)
SELECT 
    x.name,
    (SELECT id FROM inserted_generic_us),
    2,
    x.custom_label,
    x.abbreviation,
    x.weight_oz,
    x.price
FROM (VALUES
    ('X-Small', 'XS', 'XS', 5.12, 29.99),
    ('Small', 'S', 'S', 6.08, 29.99),
    ('Medium', 'M', 'M', 7.04, 29.99),
    ('Large', 'L', 'L', 8.00, 29.99),
    ('XL', 'XL', 'XL', 8.96, 29.99),
    ('XXL', '2XL', '2XL', 8.96, 32.99),
    ('XXXL', '3XL', '3XL', 10.08, 34.99),
    ('S-M', 'S-M', 'S-M', 7.04, 29.99),
    ('L-XL', 'L-XL', 'L-XL', 8.96, 29.99),
    ('One Size Fits Most', 'OS', 'OS', 8.00, 29.99),
    ('XS-S', 'XS-S', 'XS-S', 6.08, 29.99),
    ('M-L', 'M-L', 'M-L', 8.00, 29.99),
    ('XL-2XL', 'XL-2XL', 'XL-2XL', 8.96, 32.99),
    ('1X', '1X', '1X', 8.96, 32.99),
    ('2X', '2X', '2X', 8.96, 32.99),
    ('3X', '3X', '3X', 10.08, 34.99)
) as x(name, custom_label, abbreviation, weight_oz, price);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jane_secondary_variants_parent_name 
ON jane_secondary_variants(parent_id, name);