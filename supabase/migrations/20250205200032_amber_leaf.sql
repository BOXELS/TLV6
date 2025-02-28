-- Add original_url column
ALTER TABLE mockup_templates
ADD COLUMN original_url text NOT NULL DEFAULT '';

-- Update comments
COMMENT ON COLUMN mockup_templates.original_url IS 'URL to the original high-resolution mockup template image';
COMMENT ON COLUMN mockup_templates.thumbnail_url IS 'URL to the optimized thumbnail version of the mockup template';
COMMENT ON COLUMN mockup_templates.url IS 'URL to the web-optimized version of the mockup template';

-- Add index for faster lookups
CREATE INDEX idx_mockup_templates_original_url ON mockup_templates(original_url);

-- Update existing records if any
UPDATE mockup_templates
SET original_url = url
WHERE original_url = '';