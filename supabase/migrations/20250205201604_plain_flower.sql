-- Create mockup_stats table
CREATE TABLE mockup_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES mockup_templates ON DELETE CASCADE,
    views integer DEFAULT 0,
    uses integer DEFAULT 0,
    last_viewed timestamptz,
    last_used timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mockup_stats ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Mockup stats viewable by authenticated users"
    ON mockup_stats FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage mockup stats"
    ON mockup_stats FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

-- Add indexes
CREATE INDEX idx_mockup_stats_template_id ON mockup_stats(template_id);
CREATE INDEX idx_mockup_stats_views ON mockup_stats(views DESC);
CREATE INDEX idx_mockup_stats_uses ON mockup_stats(uses DESC);

-- Add trigger to update updated_at
CREATE TRIGGER update_mockup_stats_updated_at
    BEFORE UPDATE ON mockup_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE mockup_stats IS 'Tracks usage statistics for mockup templates';