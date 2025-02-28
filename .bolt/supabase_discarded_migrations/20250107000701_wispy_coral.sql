-- Drop existing jane_categories table and recreate with proper structure
DROP TABLE IF EXISTS jane_categories CASCADE;

CREATE TABLE jane_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    parent_id uuid REFERENCES jane_categories(id),
    level int NOT NULL CHECK (level BETWEEN 1 AND 3), -- 1=Main, 2=Sub, 3=Type
    created_at timestamptz DEFAULT now(),
    UNIQUE(parent_id, name)
);

-- Enable RLS
ALTER TABLE jane_categories ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to jane categories"
    ON jane_categories FOR SELECT
    TO authenticated USING (true);

-- Insert initial categories using a more reliable approach with CTEs
WITH womens AS (
    INSERT INTO jane_categories (name, level)
    VALUES ('Womens', 1)
    RETURNING id
),
tops AS (
    INSERT INTO jane_categories (name, parent_id, level)
    SELECT 'Tops', id, 2
    FROM womens
    RETURNING id
)
INSERT INTO jane_categories (name, parent_id, level)
SELECT 'Shirts & Blouses', id, 3
FROM tops;

-- Add indexes
CREATE INDEX idx_jane_categories_parent ON jane_categories(parent_id);
CREATE INDEX idx_jane_categories_level ON jane_categories(level);