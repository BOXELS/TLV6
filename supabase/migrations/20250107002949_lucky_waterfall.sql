-- Drop existing table if it exists
DROP TABLE IF EXISTS jane_secondary_variants CASCADE;

-- Create secondary variants table with same structure as primary
CREATE TABLE jane_secondary_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    parent_id uuid REFERENCES jane_secondary_variants(id),
    level int NOT NULL CHECK (level BETWEEN 1 AND 2), -- 1=Primary, 2=Sub
    created_at timestamptz DEFAULT now(),
    UNIQUE(parent_id, name)
);

-- Enable RLS
ALTER TABLE jane_secondary_variants ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to jane secondary variants"
    ON jane_secondary_variants FOR SELECT
    TO authenticated USING (true);

-- Insert primary size category
WITH inserted_primary_size AS (
    INSERT INTO jane_secondary_variants (name, level)
    VALUES ('Size', 1)
    RETURNING id
)
-- Insert size variants
INSERT INTO jane_secondary_variants (name, parent_id, level)
SELECT name, id, 2
FROM inserted_primary_size,
json_to_recordset('[
    {"name": "Small"},
    {"name": "Medium"},
    {"name": "Large"},
    {"name": "XL"},
    {"name": "XXL"},
    {"name": "XXXL"}
]'::json) as x(name text);

-- Add indexes
CREATE INDEX idx_jane_secondary_variants_parent ON jane_secondary_variants(parent_id);
CREATE INDEX idx_jane_secondary_variants_level ON jane_secondary_variants(level);