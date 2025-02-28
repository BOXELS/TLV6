/*
  # Add thumbnail URL to mockups

  1. Changes
    - Add thumb_url column to design_mockups table
    - Make thumb_url required for data consistency
    - Add index for faster lookups
*/

-- Add thumb_url column
ALTER TABLE design_mockups
ADD COLUMN thumb_url text NOT NULL;

-- Add index for faster lookups
CREATE INDEX idx_design_mockups_thumb_url ON design_mockups(thumb_url);

-- Update existing rows with url as thumb_url (if any exist)
UPDATE design_mockups
SET thumb_url = url
WHERE thumb_url IS NULL;