-- Create tables for Jane export configuration
CREATE TABLE jane_styles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    style_id text NOT NULL UNIQUE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create variant templates table
CREATE TABLE jane_variant_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    primary_variants jsonb NOT NULL, -- Array of {value, custom_label, abbreviation}
    secondary_variants jsonb NOT NULL, -- Array of {value, custom_label, abbreviation, weight_oz, price}
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE jane_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jane_variant_templates ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to jane tables" ON jane_styles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to jane tables" ON jane_variant_templates
    FOR SELECT TO authenticated USING (true);

-- Insert default style
INSERT INTO jane_styles (style_id, name)
VALUES ('6030', 'Comfort Colors 6030');

-- Insert default variant template
INSERT INTO jane_variant_templates (name, primary_variants, secondary_variants)
VALUES (
    'Standard T-Shirt Variants',
    '[
        {"value": "Off-white", "custom_label": "Ivory", "abbreviation": "Ivory"},
        {"value": "Green", "custom_label": "Moss", "abbreviation": "Mos"},
        {"value": "Blue", "custom_label": "Blue Jean", "abbreviation": "BJn"},
        {"value": "Purple", "custom_label": "Berry", "abbreviation": "Ber"},
        {"value": "White", "custom_label": "White", "abbreviation": "W"}
    ]'::jsonb,
    '[
        {"value": "Small", "custom_label": "S", "abbreviation": "S", "weight_oz": 6.08, "price": 29.99},
        {"value": "Medium", "custom_label": "M", "abbreviation": "M", "weight_oz": 7.04, "price": 29.99},
        {"value": "Large", "custom_label": "L", "abbreviation": "L", "weight_oz": 8.00, "price": 29.99},
        {"value": "XL", "custom_label": "XL", "abbreviation": "XL", "weight_oz": 8.96, "price": 29.99},
        {"value": "XXL", "custom_label": "2XL", "abbreviation": "2XL", "weight_oz": 8.96, "price": 32.99},
        {"value": "XXXL", "custom_label": "3XL", "abbreviation": "3XL", "weight_oz": 10.08, "price": 34.99}
    ]'::jsonb
);