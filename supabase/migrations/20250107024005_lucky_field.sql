/*
  # Database Backup Migration

  1. New Schema
    - Creates a new schema 'backup_20250107' to store backup tables
  
  2. Tables Backed Up
    - All design-related tables
    - User and role tables
    - Integration tables
    - Jane configuration tables
  
  3. Security
    - Enables RLS on backup tables
    - Adds read-only policies for authenticated users
*/

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20250107;

-- Backup design-related tables
CREATE TABLE backup_20250107.design_files AS 
SELECT * FROM design_files;

CREATE TABLE backup_20250107.design_categories AS 
SELECT * FROM design_categories;

CREATE TABLE backup_20250107.design_keyword_links AS 
SELECT * FROM design_keyword_links;

CREATE TABLE backup_20250107.design_mockups AS 
SELECT * FROM design_mockups;

CREATE TABLE backup_20250107.categories AS 
SELECT * FROM categories;

CREATE TABLE backup_20250107.keywords AS 
SELECT * FROM keywords;

CREATE TABLE backup_20250107.category_keyword_links AS 
SELECT * FROM category_keyword_links;

-- Backup user-related tables
CREATE TABLE backup_20250107.user_roles AS 
SELECT * FROM user_roles;

CREATE TABLE backup_20250107.user_details AS 
SELECT * FROM user_details;

-- Backup integration tables
CREATE TABLE backup_20250107.integration_credentials AS 
SELECT * FROM integration_credentials;

CREATE TABLE backup_20250107.dtf_print_lists AS 
SELECT * FROM dtf_print_lists;

-- Backup Jane configuration tables
CREATE TABLE backup_20250107.jane_categories AS 
SELECT * FROM jane_categories;

CREATE TABLE backup_20250107.jane_primary_variants AS 
SELECT * FROM jane_primary_variants;

CREATE TABLE backup_20250107.jane_secondary_variants AS 
SELECT * FROM jane_secondary_variants;

-- Add primary keys and indexes
ALTER TABLE backup_20250107.design_files 
ADD PRIMARY KEY (id);

ALTER TABLE backup_20250107.categories 
ADD PRIMARY KEY (id);

ALTER TABLE backup_20250107.keywords 
ADD PRIMARY KEY (id);

CREATE INDEX idx_backup_design_files_sku 
ON backup_20250107.design_files(sku);

CREATE INDEX idx_backup_design_files_created 
ON backup_20250107.design_files(created_at);

CREATE INDEX idx_backup_keywords_keyword 
ON backup_20250107.keywords(keyword);

-- Enable RLS on backup tables
ALTER TABLE backup_20250107.design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.design_keyword_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.design_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.category_keyword_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.user_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.dtf_print_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.jane_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.jane_primary_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107.jane_secondary_variants ENABLE ROW LEVEL SECURITY;

-- Add read-only policies for backup tables
CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.design_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.design_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.design_keyword_links FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.design_mockups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.keywords FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.category_keyword_links FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.user_details FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.integration_credentials FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.dtf_print_lists FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.jane_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.jane_primary_variants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup data"
ON backup_20250107.jane_secondary_variants FOR SELECT
TO authenticated
USING (true);

-- Add metadata
COMMENT ON SCHEMA backup_20250107 IS 'Full database backup created on 2025-01-07';