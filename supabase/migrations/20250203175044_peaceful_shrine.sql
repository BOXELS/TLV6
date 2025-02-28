-- Drop existing policy
DROP POLICY IF EXISTS "Version history viewable by authenticated users" ON version_history;

-- Create new policy that allows public access for SELECT
CREATE POLICY "Version history viewable by all users"
ON version_history FOR SELECT
TO public
USING (true);

-- Create index for better query performance
CREATE INDEX idx_version_history_released_at_desc ON version_history(released_at DESC);