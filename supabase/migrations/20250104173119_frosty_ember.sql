-- Create keywords table
CREATE TABLE keywords (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create junction tables for design_keywords and category_keywords
CREATE TABLE design_keyword_links (
    design_id uuid REFERENCES design_files ON DELETE CASCADE,
    keyword_id uuid REFERENCES keywords ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (design_id, keyword_id)
);

CREATE TABLE category_keyword_links (
    category_id uuid REFERENCES categories ON DELETE CASCADE,
    keyword_id uuid REFERENCES keywords ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (category_id, keyword_id)
);

-- Enable RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_keyword_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_keyword_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Keywords are viewable by authenticated users"
ON keywords FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Keywords can be created by authenticated users"
ON keywords FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Design keyword links are viewable by authenticated users"
ON design_keyword_links FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage keyword links for their designs"
ON design_keyword_links FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM design_files
        WHERE id = design_id AND uploaded_by = auth.uid()
    )
);

CREATE POLICY "Category keyword links are viewable by authenticated users"
ON category_keyword_links FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage category keyword links"
ON category_keyword_links FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'::user_role
    )
);

-- Create indexes for better performance
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
CREATE INDEX idx_design_keyword_links_design_id ON design_keyword_links(design_id);
CREATE INDEX idx_design_keyword_links_keyword_id ON design_keyword_links(keyword_id);
CREATE INDEX idx_category_keyword_links_category_id ON category_keyword_links(category_id);
CREATE INDEX idx_category_keyword_links_keyword_id ON category_keyword_links(keyword_id);

-- Migration function to move existing keywords
CREATE OR REPLACE FUNCTION migrate_existing_keywords()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    design_kw RECORD;
    category_kw RECORD;
    keyword_id uuid;
BEGIN
    -- Migrate design keywords
    FOR design_kw IN SELECT DISTINCT keyword FROM design_keywords LOOP
        -- Insert keyword if it doesn't exist
        INSERT INTO keywords (keyword)
        VALUES (design_kw.keyword)
        ON CONFLICT (keyword) DO NOTHING
        RETURNING id INTO keyword_id;

        -- If keyword already existed, get its id
        IF keyword_id IS NULL THEN
            SELECT id INTO keyword_id FROM keywords WHERE keyword = design_kw.keyword;
        END IF;

        -- Create links
        INSERT INTO design_keyword_links (design_id, keyword_id)
        SELECT design_id, keyword_id
        FROM design_keywords
        WHERE keyword = design_kw.keyword
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Migrate category keywords
    FOR category_kw IN SELECT DISTINCT keyword FROM category_keywords LOOP
        -- Insert keyword if it doesn't exist
        INSERT INTO keywords (keyword)
        VALUES (category_kw.keyword)
        ON CONFLICT (keyword) DO NOTHING
        RETURNING id INTO keyword_id;

        -- If keyword already existed, get its id
        IF keyword_id IS NULL THEN
            SELECT id INTO keyword_id FROM keywords WHERE keyword = category_kw.keyword;
        END IF;

        -- Create links
        INSERT INTO category_keyword_links (category_id, keyword_id)
        SELECT category_id, keyword_id
        FROM category_keywords
        WHERE keyword = category_kw.keyword
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;