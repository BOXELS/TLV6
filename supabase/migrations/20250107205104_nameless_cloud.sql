-- Drop existing table if it exists
DROP TABLE IF EXISTS jane_primary_variant_group_items CASCADE;

-- Create variant group items table
CREATE TABLE jane_primary_variant_group_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES jane_primary_variant_groups ON DELETE CASCADE,
    variant_id uuid REFERENCES jane_primary_variants ON DELETE CASCADE,
    custom_label text NOT NULL,
    abbreviation text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE jane_primary_variant_group_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can view variant group items"
ON jane_primary_variant_group_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage variant group items"
ON jane_primary_variant_group_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Add indexes
CREATE INDEX idx_variant_group_items_group ON jane_primary_variant_group_items(group_id);
CREATE INDEX idx_variant_group_items_variant ON jane_primary_variant_group_items(variant_id);
CREATE INDEX idx_variant_group_items_sort ON jane_primary_variant_group_items(sort_order);