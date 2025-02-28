-- Clear existing data
TRUNCATE TABLE jane_primary_variants CASCADE;

-- Insert primary variant colors
INSERT INTO jane_primary_variants (name, custom_label, color_group) VALUES
    ('Beige', 'Beige', 'Beige'),
    ('Black', 'Black', 'Black'),
    ('Blue', 'Blue', 'Blue'),
    ('Brown', 'Brown', 'Brown'),
    ('Gold', 'Gold', 'Gold'),
    ('Grey', 'Grey', 'Grey'),
    ('Green', 'Green', 'Green'),
    ('Multicolored', 'Multicolored', 'Multi'),
    ('Off-white', 'Off-white', 'White'),
    ('Orange', 'Orange', 'Orange'),
    ('Pink', 'Pink', 'Pink'),
    ('Purple', 'Purple', 'Purple'),
    ('Red', 'Red', 'Red'),
    ('Silver', 'Silver', 'Silver'),
    ('White', 'White', 'White'),
    ('Yellow', 'Yellow', 'Yellow');

-- Add index for faster color lookups
CREATE INDEX IF NOT EXISTS idx_jane_primary_variants_name ON jane_primary_variants(name);