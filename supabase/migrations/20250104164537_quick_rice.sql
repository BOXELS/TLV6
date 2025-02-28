/*
  # Create WORKING-B backup

  1. New Schema
    - Creates backup schema 'backup_20240104_WORKING_B'
    - Includes all tables and their data
    - Adds proper indexes and constraints
    - Enables RLS with read-only policies

  2. Security
    - All backup tables have RLS enabled
    - Only authenticated users can view backup data
    - No modification of backup data is allowed
*/

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20240104_WORKING_B;

-- Backup current tables with their data
CREATE TABLE backup_20240104_WORKING_B.categories AS 
SELECT * FROM categories;

CREATE TABLE backup_20240104_WORKING_B.design_files AS 
SELECT * FROM design_files;

CREATE TABLE backup_20240104_WORKING_B.design_keywords AS 
SELECT * FROM design_keywords;

CREATE TABLE backup_20240104_WORKING_B.design_categories AS 
SELECT * FROM design_categories;

CREATE TABLE backup_20240104_WORKING_B.design_mockups AS 
SELECT * FROM design_mockups;

CREATE TABLE backup_20240104_WORKING_B.category_keywords AS 
SELECT * FROM category_keywords;

-- Add primary keys and indexes
ALTER TABLE backup_20240104_WORKING_B.categories 
ADD PRIMARY KEY (id);

ALTER TABLE backup_20240104_WORKING_B.design_files 
ADD PRIMARY KEY (id);

CREATE INDEX idx_backup_workingb_design_files_sku 
ON backup_20240104_WORKING_B.design_files(sku);

CREATE INDEX idx_backup_workingb_design_files_created 
ON backup_20240104_WORKING_B.design_files(created_at);

CREATE INDEX idx_backup_workingb_category_keywords
ON backup_20240104_WORKING_B.category_keywords(category_id);

-- Add metadata
COMMENT ON SCHEMA backup_20240104_WORKING_B IS 'WORKING-B backup created on 2024-01-04 - Print Files Manager with working storage and category management';

-- Enable RLS on backup tables
ALTER TABLE backup_20240104_WORKING_B.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKING_B.design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKING_B.design_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKING_B.design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKING_B.design_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240104_WORKING_B.category_keywords ENABLE ROW LEVEL SECURITY;

-- Add read-only policies for backup tables
CREATE POLICY "Authenticated users can view backup categories"
ON backup_20240104_WORKING_B.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup designs"
ON backup_20240104_WORKING_B.design_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup keywords"
ON backup_20240104_WORKING_B.design_keywords FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup categories junction"
ON backup_20240104_WORKING_B.design_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup mockups"
ON backup_20240104_WORKING_B.design_mockups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup category keywords"
ON backup_20240104_WORKING_B.category_keywords FOR SELECT
TO authenticated
USING (true);