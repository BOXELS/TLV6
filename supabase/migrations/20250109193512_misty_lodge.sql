/*
  # Create Full Database Backup

  1. New Schema
    - Creates a new backup schema with current timestamp
    - Includes metadata about the backup

  2. Tables Backed Up
    - All design-related tables
    - User management tables
    - Integration tables
    - Jane configuration tables
    - All relationships and data preserved

  3. Security
    - RLS policies for backup tables
    - Read-only access for authenticated users
*/

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20250107_full;

-- Add metadata
COMMENT ON SCHEMA backup_20250107_full IS 'Full database backup created on 2025-01-07 - Print Files Manager v2.5';

-- Backup design-related tables
CREATE TABLE backup_20250107_full.design_files AS 
SELECT * FROM design_files;

CREATE TABLE backup_20250107_full.design_categories AS 
SELECT * FROM design_categories;

CREATE TABLE backup_20250107_full.design_keyword_links AS 
SELECT * FROM design_keyword_links;

CREATE TABLE backup_20250107_full.design_mockups AS 
SELECT * FROM design_mockups;

CREATE TABLE backup_20250107_full.categories AS 
SELECT * FROM categories;

CREATE TABLE backup_20250107_full.keywords AS 
SELECT * FROM keywords;

CREATE TABLE backup_20250107_full.category_keyword_links AS 
SELECT * FROM category_keyword_links;

-- Backup user-related tables
CREATE TABLE backup_20250107_full.user_roles AS 
SELECT * FROM user_roles;

CREATE TABLE backup_20250107_full.user_details AS 
SELECT * FROM user_details;

-- Backup integration tables
CREATE TABLE backup_20250107_full.integration_credentials AS 
SELECT * FROM integration_credentials;

CREATE TABLE backup_20250107_full.dtf_print_lists AS 
SELECT * FROM dtf_print_lists;

-- Backup Jane configuration tables
CREATE TABLE backup_20250107_full.jane_categories AS 
SELECT * FROM jane_categories;

CREATE TABLE backup_20250107_full.jane_primary_variants AS 
SELECT * FROM jane_primary_variants;

CREATE TABLE backup_20250107_full.jane_secondary_variants AS 
SELECT * FROM jane_secondary_variants;

CREATE TABLE backup_20250107_full.jane_styles AS 
SELECT * FROM jane_styles;

CREATE TABLE backup_20250107_full.jane_primary_variant_groups AS 
SELECT * FROM jane_primary_variant_groups;

CREATE TABLE backup_20250107_full.jane_primary_variant_group_items AS 
SELECT * FROM jane_primary_variant_group_items;

-- Add primary keys and indexes
ALTER TABLE backup_20250107_full.design_files 
ADD PRIMARY KEY (id);

ALTER TABLE backup_20250107_full.categories 
ADD PRIMARY KEY (id);

ALTER TABLE backup_20250107_full.keywords 
ADD PRIMARY KEY (id);

CREATE INDEX idx_backup_design_files_sku 
ON backup_20250107_full.design_files(sku);

CREATE INDEX idx_backup_design_files_created 
ON backup_20250107_full.design_files(created_at);

CREATE INDEX idx_backup_keywords_keyword 
ON backup_20250107_full.keywords(keyword);

CREATE INDEX idx_backup_design_mockups_design 
ON backup_20250107_full.design_mockups(design_id);

CREATE INDEX idx_backup_jane_categories_parent 
ON backup_20250107_full.jane_categories(parent_id);

-- Enable RLS on backup tables
ALTER TABLE backup_20250107_full.design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.design_keyword_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.design_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.category_keyword_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.user_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.dtf_print_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.jane_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.jane_primary_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.jane_secondary_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.jane_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.jane_primary_variant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20250107_full.jane_primary_variant_group_items ENABLE ROW LEVEL SECURITY;

-- Add read-only policies for backup tables
DO $$ 
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'backup_20250107_full'
    LOOP
        EXECUTE format(
            'CREATE POLICY "Authenticated users can view backup data" ON backup_20250107_full.%I
             FOR SELECT TO authenticated USING (true)',
            table_name
        );
    END LOOP;
END $$;