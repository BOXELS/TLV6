/*
  # Backup existing design data

  1. Purpose
    - Create a backup of existing design data
    - Ensure data consistency
    - Document current state

  2. Tables Backed Up
    - design_files
    - design_keywords
    - design_categories
    - design_mockups
    - categories
*/

-- Create backup tables
CREATE TABLE IF NOT EXISTS design_files_backup_20240104 AS 
SELECT * FROM design_files;

CREATE TABLE IF NOT EXISTS design_keywords_backup_20240104 AS 
SELECT * FROM design_keywords;

CREATE TABLE IF NOT EXISTS design_categories_backup_20240104 AS 
SELECT * FROM design_categories;

CREATE TABLE IF NOT EXISTS design_mockups_backup_20240104 AS 
SELECT * FROM design_mockups;

CREATE TABLE IF NOT EXISTS categories_backup_20240104 AS 
SELECT * FROM categories;

-- Add indexes to backup tables for better query performance
CREATE INDEX IF NOT EXISTS idx_design_files_backup_sku ON design_files_backup_20240104(sku);
CREATE INDEX IF NOT EXISTS idx_design_keywords_backup_design_id ON design_keywords_backup_20240104(design_id);
CREATE INDEX IF NOT EXISTS idx_design_categories_backup_design_id ON design_categories_backup_20240104(design_id);
CREATE INDEX IF NOT EXISTS idx_design_mockups_backup_design_id ON design_mockups_backup_20240104(design_id);

-- Enable RLS on backup tables
ALTER TABLE design_files_backup_20240104 ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_keywords_backup_20240104 ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_categories_backup_20240104 ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_mockups_backup_20240104 ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_backup_20240104 ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for backup tables (read-only access for authenticated users)
CREATE POLICY "Authenticated users can view backup files"
ON design_files_backup_20240104 FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup keywords"
ON design_keywords_backup_20240104 FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup categories"
ON design_categories_backup_20240104 FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup mockups"
ON design_mockups_backup_20240104 FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup categories list"
ON categories_backup_20240104 FOR SELECT
TO authenticated
USING (true);