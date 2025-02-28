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
    abbreviation
)
SELECT 
    x.name,
    (SELECT id FROM inserted_generic_us),
    2,
    x.custom_label,
    x.abbreviation
FROM (VALUES
    ('X-Small', 'XS', 'XS'),
    ('Small', 'S', 'S'),
    ('Medium', 'M', 'M'),
    ('Large', 'L', 'L'),
    ('XL', 'XL', 'XL'),
    ('XXL', '2XL', '2XL'),
    ('XXXL', '3XL', '3XL'),
    ('S-M', 'S-M', 'S-M'),
    ('L-XL', 'L-XL', 'L-XL'),
    ('One Size Fits Most', 'OS', 'OS'),
    ('XS-S', 'XS-S', 'XS-S'),
    ('M-L', 'M-L', 'M-L'),
    ('XL-2XL', 'XL-2XL', 'XL-2XL'),
    ('1X', '1X', '1X'),
    ('2X', '2X', '2X'),
    ('3X', '3X', '3X')
) as x(name, custom_label, abbreviation);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jane_secondary_variants_parent_name 
ON jane_secondary_variants(parent_id, name);