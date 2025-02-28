-- Create version_history table
CREATE TABLE version_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version text NOT NULL,
    released_at timestamptz DEFAULT now(),
    released_by uuid REFERENCES auth.users NOT NULL,
    changes text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE version_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Version history viewable by authenticated users"
    ON version_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Version history manageable by admins"
    ON version_history FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

-- Add indexes
CREATE INDEX idx_version_history_version ON version_history(version);
CREATE INDEX idx_version_history_released_at ON version_history(released_at);

-- Add initial version history entries from changelog
INSERT INTO version_history (version, released_at, released_by, changes)
SELECT 
    '1.2.9',
    '2025-02-03'::timestamptz,
    (SELECT id FROM auth.users WHERE email = 'jareds.smith@gmail.com'),
    'Version bump'
WHERE NOT EXISTS (SELECT 1 FROM version_history WHERE version = '1.2.9');