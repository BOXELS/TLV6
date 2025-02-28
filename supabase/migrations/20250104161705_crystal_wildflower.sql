-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20240104_WORKINGA;

-- Backup current tables with their data
CREATE TABLE backup_20240104_WORKINGA.categories AS 
SELECT * FROM categories;

CREATE TABLE backup_20240104_WORKINGA.design_files AS 
SELECT * FROM design_files;

CREATE TABLE backup_20240104_WORKINGA.design_keywords AS 
SELECT * FROM design_keywords;

CREATE TABLE backup_20240104_WORKINGA.design_categories AS 
SELECT * FROM design_categories;

CREATE TABLE backup_20240104_WORKINGA.design_mockups AS 
SELECT * FROM design_mockups;

-- Add primary keys and indexes
ALTER TABLE backup_20240104_WORKINGA.categories 
ADD PRIMARY KEY (id);

ALTER TABLE backup_20240104_WORKINGA.design_files 
ADD PRIMARY KEY (id);

CREATE INDEX idx_backup_workinga_design_files_sku 
ON backup_20240104_WORKINGA.design_files(sku);

CREATE INDEX idx_backup_workinga_design_files_created 
ON backup_20240104_WORKINGA.design_files(created_at);

-- Add metadata
COMMENT ON SCHEMA backup_20240104_WORKINGA IS 'Working backup created on 2024-01-04 - Print Files Manager with working storage policies';

-- Enable RLS on backup tables
ALTER TABLE backup_20240104_WORKINGA.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKINGA.design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKINGA.design_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKINGA.design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKINGA.design_mockups ENABLE ROW LEVEL SECURITY;

-- Add read-only policies for backup tables
CREATE POLICY "Authenticated users can view backup categories"
ON backup_20240104_WORKINGA.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup designs"
ON backup_20240104_WORKINGA.design_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup keywords"
ON backup_20240104_WORKINGA.design_keywords FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup categories junction"
ON backup_20240104_WORKINGA.design_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup mockups"
ON backup_20240104_WORKINGA.design_mockups FOR SELECT
TO authenticated
USING (true);