/*
  # Add category keywords support
  
  1. New Tables
    - `category_keywords`
      - `id` (uuid, primary key)
      - `category_id` (uuid, references categories)
      - `keyword` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on new table
    - Add policies for admin access
*/

-- Create category keywords table
CREATE TABLE category_keywords (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES categories ON DELETE CASCADE,
    keyword text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(category_id, keyword)
);

-- Enable RLS
ALTER TABLE category_keywords ENABLE ROW LEVEL SECURITY;

-- Policies for category keywords
CREATE POLICY "Authenticated users can view category keywords"
ON category_keywords FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage category keywords"
ON category_keywords FOR ALL
TO authenticated
USING (is_admin(auth.uid()));