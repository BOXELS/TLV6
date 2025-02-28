-- Create clothing styles table
CREATE TABLE clothing_styles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    style_id text UNIQUE NOT NULL,
    title text NOT NULL,
    keywords text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clothing_styles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Clothing styles viewable by authenticated users"
    ON clothing_styles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage clothing styles"
    ON clothing_styles FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

-- Add indexes
CREATE INDEX idx_clothing_styles_style_id ON clothing_styles(style_id);
CREATE INDEX idx_clothing_styles_title ON clothing_styles(title);
CREATE INDEX idx_clothing_styles_keywords ON clothing_styles USING gin(keywords);

-- Add trigger for updated_at
CREATE TRIGGER update_clothing_styles_updated_at
    BEFORE UPDATE ON clothing_styles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE clothing_styles IS 'Stores clothing style information with style IDs and metadata';

-- Add foreign key to mockup_templates
ALTER TABLE mockup_templates
DROP CONSTRAINT IF EXISTS mockup_templates_style_id_fkey,
ADD CONSTRAINT mockup_templates_style_id_fkey 
    FOREIGN KEY (style_id) 
    REFERENCES clothing_styles(style_id)
    ON DELETE RESTRICT;