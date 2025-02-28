/*
  # Add Jane Primary Variant Groups

  1. New Tables
    - `jane_primary_variant_groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamptz)
    - `jane_primary_variant_group_items`
      - `id` (uuid, primary key) 
      - `group_id` (uuid, references jane_primary_variant_groups)
      - `variant_id` (uuid, references jane_primary_variants)
      - `custom_label` (text)
      - `abbreviation` (text)
      - `sort_order` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to view
    - Add policies for admins to manage
*/

-- Create variant groups table
CREATE TABLE jane_primary_variant_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create variant group items table
CREATE TABLE jane_primary_variant_group_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES jane_primary_variant_groups ON DELETE CASCADE,
    variant_id uuid REFERENCES jane_primary_variants ON DELETE CASCADE,
    custom_label text NOT NULL,
    abbreviation text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(group_id, variant_id)
);

-- Enable RLS
ALTER TABLE jane_primary_variant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE jane_primary_variant_group_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can view variant groups"
ON jane_primary_variant_groups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage variant groups"
ON jane_primary_variant_groups FOR ALL
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