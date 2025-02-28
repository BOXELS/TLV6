-- Update existing version history entries to use proper line breaks
UPDATE version_history
SET changes = REPLACE(changes, '. ', E'.\n')
WHERE changes LIKE '%. %';

-- Add comment to changes column
COMMENT ON COLUMN version_history.changes IS 'Stores version changes with line breaks preserved using \n characters';

-- Create function to format changes text
CREATE OR REPLACE FUNCTION format_version_changes(changes text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT REGEXP_REPLACE(changes, '(?<=[.!?])\s+', E'\n', 'g');
$$;