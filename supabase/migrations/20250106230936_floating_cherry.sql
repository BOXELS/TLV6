/*
  # Jane CSV Export Tables

  1. New Tables
    - `jane_categories` - Product category hierarchy
    - `jane_primary_variants` - Primary variant options (colors)
    - `jane_secondary_variants` - Secondary variant options (sizes)
    - `jane_product_types` - Product type definitions

  2. Structure
    - Hierarchical categories with parent-child relationships
    - Variant systems with custom labels and values
    - Support for product type specific attributes

  3. Changes
    - Creates new tables for Jane CSV export
    - Adds necessary indexes and relationships
    - Includes default data for variants
*/

-- Create enum for product status
CREATE TYPE jane_product_status AS ENUM ('Draft', 'Active', 'Inactive');

-- Create product types table
CREATE TABLE jane_product_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    is_handmade boolean DEFAULT false,
    is_digital boolean DEFAULT false,
    has_free_shipping boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create categories table with hierarchy
CREATE TABLE jane_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    parent_id uuid REFERENCES jane_categories(id),
    level int NOT NULL, -- 1=Main, 2=Sub, 3=Type
    path_name text NOT NULL, -- URL-friendly path segment
    full_path text NOT NULL, -- Full category path (e.g., "Womens > Tops > Shirts")
    created_at timestamptz DEFAULT now(),
    UNIQUE(parent_id, name),
    UNIQUE(path_name, level)
);

-- Create primary variants table (colors)
CREATE TABLE jane_primary_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    custom_label text NOT NULL,
    color_group text NOT NULL, -- For grouping similar colors
    created_at timestamptz DEFAULT now(),
    UNIQUE(name, custom_label)
);

-- Create secondary variants table (sizes)
CREATE TABLE jane_secondary_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    display_order int NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(name)
);

-- Add indexes
CREATE INDEX idx_jane_categories_parent ON jane_categories(parent_id);
CREATE INDEX idx_jane_categories_path ON jane_categories(path_name);
CREATE INDEX idx_jane_primary_variants_color ON jane_primary_variants(color_group);

-- Enable RLS
ALTER TABLE jane_product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE jane_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jane_primary_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE jane_secondary_variants ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to jane tables" ON jane_product_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to jane tables" ON jane_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to jane tables" ON jane_primary_variants
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to jane tables" ON jane_secondary_variants
    FOR SELECT TO authenticated USING (true);

-- Insert default product type
INSERT INTO jane_product_types (name, is_handmade, is_digital, has_free_shipping)
VALUES ('Graphic Tees', true, false, true);

-- Insert main categories
INSERT INTO jane_categories (name, level, path_name, full_path)
VALUES ('Womens', 1, 'womens', 'Womens');

-- Get the Womens category ID
DO $$
DECLARE
    womens_id uuid;
BEGIN
    SELECT id INTO womens_id FROM jane_categories WHERE name = 'Womens';

    -- Insert subcategories
    INSERT INTO jane_categories (name, parent_id, level, path_name, full_path)
    VALUES ('Tops', womens_id, 2, 'tops', 'Womens > Tops');

    -- Get the Tops category ID
    WITH tops AS (
        SELECT id FROM jane_categories 
        WHERE name = 'Tops' AND parent_id = womens_id
    )
    INSERT INTO jane_categories (name, parent_id, level, path_name, full_path)
    SELECT 'Shirts & Blouses', id, 3, 'shirts-and-blouses', 'Womens > Tops > Shirts & Blouses'
    FROM tops;
END $$;

-- Insert some primary variants (colors)
INSERT INTO jane_primary_variants (name, custom_label, color_group) VALUES
    ('Off-white', 'Ivory', 'White'),
    ('White', 'White', 'White'),
    ('Green', 'Moss', 'Green'),
    ('Blue', 'Blue Jean', 'Blue'),
    ('Purple', 'Berry', 'Purple');

-- Insert secondary variants (sizes)
INSERT INTO jane_secondary_variants (name, display_order) VALUES
    ('Small', 1),
    ('Medium', 2),
    ('Large', 3),
    ('XL', 4),
    ('XXL', 5),
    ('XXXL', 6);

COMMENT ON TABLE jane_categories IS 'Hierarchical product categories for Jane exports';
COMMENT ON TABLE jane_primary_variants IS 'Primary variant options (colors) for Jane products';
COMMENT ON TABLE jane_secondary_variants IS 'Secondary variant options (sizes) for Jane products';
COMMENT ON TABLE jane_product_types IS 'Product type definitions with default settings';