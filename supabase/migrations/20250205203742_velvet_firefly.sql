-- Add clothing_style_id column to mockup_templates
ALTER TABLE mockup_templates
ADD COLUMN clothing_style_id uuid REFERENCES clothing_styles(id) ON DELETE RESTRICT;

-- Create index for better join performance
CREATE INDEX idx_mockup_templates_clothing_style_id ON mockup_templates(clothing_style_id);

-- Update existing records if any
UPDATE mockup_templates mt
SET clothing_style_id = cs.id
FROM clothing_styles cs
WHERE mt.style_id = cs.style_id;

-- Drop old style_id column after migration
ALTER TABLE mockup_templates
DROP COLUMN IF EXISTS style_id;

-- Add comment
COMMENT ON COLUMN mockup_templates.clothing_style_id IS 'References clothing_styles.id for style information';