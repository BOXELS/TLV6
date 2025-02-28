-- Drop and recreate shipstation_tags table with proper constraints
DROP TABLE IF EXISTS shipstation_tags;

CREATE TABLE shipstation_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id integer UNIQUE NOT NULL,
    name text NOT NULL,
    color text NOT NULL DEFAULT '#6B7280',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shipstation_tags ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can view tags"
ON shipstation_tags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage tags"
ON shipstation_tags FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_shipstation_tags_updated_at
    BEFORE UPDATE ON shipstation_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_shipstation_tags_tag_id ON shipstation_tags(tag_id);
CREATE INDEX idx_shipstation_tags_name ON shipstation_tags(name);

COMMENT ON TABLE shipstation_tags IS 'Stores Shipstation tag information for local reference';