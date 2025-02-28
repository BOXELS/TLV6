/*
  # Design Files Schema Update

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)
    
    - `design_files`
      - `id` (uuid, primary key) 
      - `sku` (text, unique)
      - `title` (text)
      - `uploaded_by` (uuid, references auth.users)
      - `print_file_url` (text)
      - `web_file_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `design_keywords`
      - `id` (uuid, primary key)
      - `design_id` (uuid, references design_files)
      - `keyword` (text)

    - `design_categories`
      - `design_id` (uuid, references design_files)
      - `category_id` (uuid, references categories)
      - Primary key is (design_id, category_id)

    - `design_mockups`
      - `id` (uuid, primary key)
      - `design_id` (uuid, references design_files)
      - `url` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Categories table
CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Design files table
CREATE TABLE design_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku text UNIQUE NOT NULL,
    title text NOT NULL,
    uploaded_by uuid REFERENCES auth.users NOT NULL,
    print_file_url text NOT NULL,
    web_file_url text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Keywords table (many-to-many)
CREATE TABLE design_keywords (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id uuid REFERENCES design_files ON DELETE CASCADE,
    keyword text NOT NULL,
    UNIQUE(design_id, keyword)
);

-- Categories junction table
CREATE TABLE design_categories (
    design_id uuid REFERENCES design_files ON DELETE CASCADE,
    category_id uuid REFERENCES categories ON DELETE CASCADE,
    PRIMARY KEY (design_id, category_id)
);

-- Mockups table
CREATE TABLE design_mockups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id uuid REFERENCES design_files ON DELETE CASCADE,
    url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_mockups ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Categories are viewable by authenticated users"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Categories can be created by authenticated users"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policies for design_files
CREATE POLICY "Design files are viewable by authenticated users"
    ON design_files FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own design files"
    ON design_files FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own design files"
    ON design_files FOR UPDATE
    TO authenticated
    USING (auth.uid() = uploaded_by);

-- Policies for design_keywords
CREATE POLICY "Keywords are viewable by authenticated users"
    ON design_keywords FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage keywords for their designs"
    ON design_keywords FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM design_files
            WHERE id = design_id AND uploaded_by = auth.uid()
        )
    );

-- Policies for design_categories
CREATE POLICY "Design categories are viewable by authenticated users"
    ON design_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage categories for their designs"
    ON design_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM design_files
            WHERE id = design_id AND uploaded_by = auth.uid()
        )
    );

-- Policies for design_mockups
CREATE POLICY "Mockups are viewable by authenticated users"
    ON design_mockups FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage mockups for their designs"
    ON design_mockups FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM design_files
            WHERE id = design_id AND uploaded_by = auth.uid()
        )
    );

-- Add updated_at trigger for design_files
CREATE TRIGGER update_design_files_updated_at
    BEFORE UPDATE ON design_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();