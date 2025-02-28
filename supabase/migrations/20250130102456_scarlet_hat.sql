/*
  # Add Description Column to Design Files

  1. Changes
    - Add description column to design_files table
    - Make it nullable since existing records won't have descriptions
    - Add index for better search performance

  2. Notes
    - No data migration needed since new column is nullable
    - Description will be populated for new designs going forward
*/

-- Add description column
ALTER TABLE design_files
ADD COLUMN description text;

-- Add index for description search
CREATE INDEX idx_design_files_description ON design_files USING gin(to_tsvector('english', COALESCE(description, '')));

COMMENT ON COLUMN design_files.description IS 'Stores the AI-generated or user-provided description of the design';