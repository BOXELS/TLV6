/*
  # Backup of Print Files Manager Schema and Data

  This migration creates a backup of the current working state of the application.
  It includes:
  1. Schema backup
  2. Data backup
  3. Indexes and constraints
  4. RLS policies
*/

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20240105;

-- Backup tables with their data
CREATE TABLE backup_20240105.categories AS 
SELECT * FROM categories;

CREATE TABLE backup_20240105.design_files AS 
SELECT * FROM design_files;

CREATE TABLE backup_20240105.design_keywords AS 
SELECT * FROM design_keywords;

CREATE TABLE backup_20240105.design_categories AS 
SELECT * FROM design_categories;

CREATE TABLE backup_20240105.design_mockups AS 
SELECT * FROM design_mockups;

-- Add primary keys and indexes
ALTER TABLE backup_20240105.categories 
ADD PRIMARY KEY (id);

ALTER TABLE backup_20240105.design_files 
ADD PRIMARY KEY (id);

CREATE INDEX idx_backup_design_files_sku 
ON backup_20240105.design_files(sku);

CREATE INDEX idx_backup_design_files_created 
ON backup_20240105.design_files(created_at);

-- Add metadata
COMMENT ON SCHEMA backup_20240105 IS 'Backup created on 2024-01-05 - Print Files Manager v1.2.0';

-- Enable RLS on backup tables
ALTER TABLE backup_20240105.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240105.design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240105.design_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240105.design_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_20240105.design_mockups ENABLE ROW LEVEL SECURITY;

-- Add read-only policies for backup tables
CREATE POLICY "Authenticated users can view backup categories"
ON backup_20240105.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup designs"
ON backup_20240105.design_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup keywords"
ON backup_20240105.design_keywords FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup categories junction"
ON backup_20240105.design_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view backup mockups"
ON backup_20240105.design_mockups FOR SELECT
TO authenticated
USING (true);