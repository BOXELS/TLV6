/*
  # Add Shipstation Tags Table

  1. New Tables
    - `shipstation_tags`
      - `id` (uuid, primary key)
      - `tag_id` (integer, unique)
      - `name` (text)
      - `color` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create shipstation_tags table
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

COMMENT ON TABLE shipstation_tags IS 'Stores Shipstation tag information for local reference';