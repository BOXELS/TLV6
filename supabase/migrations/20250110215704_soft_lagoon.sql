-- Add title_append column to jane_designs_listed
ALTER TABLE jane_designs_listed
ADD COLUMN title_append text;

-- Add index for better query performance
CREATE INDEX idx_jane_designs_listed_title_append 
ON jane_designs_listed(title_append);

COMMENT ON COLUMN jane_designs_listed.title_append IS 'Stores the title append text used when listing on Jane';