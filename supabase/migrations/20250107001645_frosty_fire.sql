-- Drop existing table if it exists
DROP TABLE IF EXISTS jane_primary_variants CASCADE;

-- Create primary variants table with proper structure
CREATE TABLE jane_primary_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    parent_id uuid REFERENCES jane_primary_variants(id),
    level int NOT NULL CHECK (level BETWEEN 1 AND 2), -- 1=Primary, 2=Sub
    created_at timestamptz DEFAULT now(),
    UNIQUE(parent_id, name)
);

-- Enable RLS
ALTER TABLE jane_primary_variants ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to jane primary variants"
    ON jane_primary_variants FOR SELECT
    TO authenticated USING (true);

-- Insert primary color category
WITH inserted_primary_color AS (
    INSERT INTO jane_primary_variants (name, level)
    VALUES ('Primary Color', 1)
    RETURNING id
)
-- Insert color variants
INSERT INTO jane_primary_variants (name, parent_id, level)
SELECT name, id, 2
FROM inserted_primary_color,
json_to_recordset('[
    {"name": "Beige"},
    {"name": "Black"},
    {"name": "Blue"},
    {"name": "Brown"},
    {"name": "Gold"},
    {"name": "Grey"},
    {"name": "Green"},
    {"name": "Multicolored"},
    {"name": "Off-white"},
    {"name": "Orange"},
    {"name": "Pink"},
    {"name": "Purple"},
    {"name": "Red"},
    {"name": "Silver"},
    {"name": "White"},
    {"name": "Yellow"}
]'::json) as x(name text);

-- Add indexes
CREATE INDEX idx_jane_primary_variants_parent ON jane_primary_variants(parent_id);
CREATE INDEX idx_jane_primary_variants_level ON jane_primary_variants(level);