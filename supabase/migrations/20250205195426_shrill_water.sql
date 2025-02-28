-- Add new columns to mockup_templates table
ALTER TABLE mockup_templates
ADD COLUMN color_tags text[] DEFAULT '{}',
ADD COLUMN keywords text[] DEFAULT '{}';

-- Add indexes for better query performance
CREATE INDEX idx_mockup_templates_color_tags ON mockup_templates USING gin(color_tags);
CREATE INDEX idx_mockup_templates_keywords ON mockup_templates USING gin(keywords);

-- Update comment to reflect new columns
COMMENT ON TABLE mockup_templates IS 'Stores mockup template images with design placement areas, color tags, and keywords';

-- Add comments for new columns
COMMENT ON COLUMN mockup_templates.color_tags IS 'Array of color tags associated with the mockup template';
COMMENT ON COLUMN mockup_templates.keywords IS 'Array of keywords associated with the mockup template';