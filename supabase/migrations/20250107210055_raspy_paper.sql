-- Drop existing table if it exists
DROP TABLE IF EXISTS jane_styles CASCADE;

-- Create styles table
CREATE TABLE jane_styles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    style_id text UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE jane_styles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can view styles"
ON jane_styles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage styles"
ON jane_styles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Add indexes
CREATE INDEX idx_styles_style_id ON jane_styles(style_id);