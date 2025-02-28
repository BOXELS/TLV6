-- Add title column
ALTER TABLE mockup_templates
ADD COLUMN title text NOT NULL DEFAULT '',
ADD COLUMN url text NOT NULL DEFAULT '';

-- Add index for title search
CREATE INDEX idx_mockup_templates_title ON mockup_templates(title);

-- Update comments
COMMENT ON COLUMN mockup_templates.title IS 'Display title for the mockup template';
COMMENT ON COLUMN mockup_templates.url IS 'URL to the mockup template image';

-- Rename existing columns for clarity
ALTER TABLE mockup_templates 
RENAME COLUMN name TO original_filename;

ALTER TABLE mockup_templates
RENAME COLUMN image_url TO thumbnail_url;