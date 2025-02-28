-- Create mockup templates table
CREATE TABLE mockup_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    style_id text REFERENCES jane_styles(style_id),
    image_url text NOT NULL,
    design_area jsonb NOT NULL DEFAULT '{"points": []}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mockup_templates ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Mockup templates viewable by authenticated users"
    ON mockup_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage mockup templates"
    ON mockup_templates FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

-- Add updated_at trigger
CREATE TRIGGER update_mockup_templates_updated_at
    BEFORE UPDATE ON mockup_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_mockup_templates_style_id ON mockup_templates(style_id);
CREATE INDEX idx_mockup_templates_created_at ON mockup_templates(created_at);

COMMENT ON TABLE mockup_templates IS 'Stores mockup template images with design placement areas';