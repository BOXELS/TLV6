-- Create jane_title_appends table
CREATE TABLE jane_title_appends (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text text NOT NULL,
    is_default boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE jane_title_appends ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can view title appends"
ON jane_title_appends FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage title appends"
ON jane_title_appends FOR ALL
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

-- Insert default values
INSERT INTO jane_title_appends (text, is_default, sort_order) VALUES
    ('None (default)', true, 0),
    ('Unisex Soft T-shirt', false, 1),
    ('Unisex Soft Sweatshirt', false, 2),
    ('Toddler Tee', false, 3);