/*
  # Add DTF Print Lists Table
  
  1. New Tables
    - `dtf_print_lists`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
      - `items` (jsonb)
      - `total_quantity` (integer)
      - `order_ids` (text[])
  
  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create DTF print lists table
CREATE TABLE dtf_print_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users NOT NULL,
    items jsonb NOT NULL,
    total_quantity integer NOT NULL,
    order_ids text[] NOT NULL
);

-- Enable RLS
ALTER TABLE dtf_print_lists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own print lists"
    ON dtf_print_lists FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own print lists"
    ON dtf_print_lists FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Add indexes
CREATE INDEX idx_dtf_print_lists_created_by ON dtf_print_lists(created_by);
CREATE INDEX idx_dtf_print_lists_created_at ON dtf_print_lists(created_at);

COMMENT ON TABLE dtf_print_lists IS 'Stores DTF print lists generated from Shipstation orders';