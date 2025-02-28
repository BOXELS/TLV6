-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_jane_designs_listed_status 
ON jane_designs_listed(status);

CREATE INDEX IF NOT EXISTS idx_jane_designs_listed_design_status 
ON jane_designs_listed(design_id, status);

-- Create function to get Jane listing status
CREATE OR REPLACE FUNCTION get_jane_listing_status(design_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT status
    FROM jane_designs_listed
    WHERE design_id = $1
    LIMIT 1
  );
END;
$$;