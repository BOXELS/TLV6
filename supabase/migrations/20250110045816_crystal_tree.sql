/*
  # Add Jane listings tracking
  
  1. New Tables
    - `jane_designs_listed` tracks which designs have been listed on Jane
      - `id` (uuid, primary key)
      - `design_id` (uuid, references design_files)
      - `style_id` (text, references jane_styles)
      - `listed_at` (timestamptz)
      - `listed_by` (uuid, references auth.users)
      - `updated_at` (timestamptz)
      - `status` (text) - 'active' or 'inactive'
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create jane_designs_listed table
CREATE TABLE jane_designs_listed (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id uuid REFERENCES design_files ON DELETE CASCADE,
    style_id text REFERENCES jane_styles(style_id),
    listed_at timestamptz DEFAULT now(),
    listed_by uuid REFERENCES auth.users,
    updated_at timestamptz DEFAULT now(),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    UNIQUE(design_id)
);

-- Enable RLS
ALTER TABLE jane_designs_listed ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can view jane listings"
ON jane_designs_listed FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own listings"
ON jane_designs_listed FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM design_files
        WHERE id = design_id
        AND uploaded_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM design_files
        WHERE id = design_id
        AND uploaded_by = auth.uid()
    )
);

-- Add updated_at trigger
CREATE TRIGGER update_jane_designs_listed_updated_at
    BEFORE UPDATE ON jane_designs_listed
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_jane_designs_listed_design ON jane_designs_listed(design_id);
CREATE INDEX idx_jane_designs_listed_style ON jane_designs_listed(style_id);
CREATE INDEX idx_jane_designs_listed_status ON jane_designs_listed(status);

COMMENT ON TABLE jane_designs_listed IS 'Tracks which designs have been listed on Jane marketplace';