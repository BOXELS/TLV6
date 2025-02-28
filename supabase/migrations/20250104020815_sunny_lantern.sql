/*
  # Backup current schema state

  Creates a backup of the current schema state before restoration
*/

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20240104_current;

-- Backup current tables
CREATE TABLE backup_20240104_current.categories AS 
SELECT * FROM categories;

CREATE TABLE backup_20240104_current.design_files AS 
SELECT * FROM design_files;

CREATE TABLE backup_20240104_current.design_keywords AS 
SELECT * FROM design_keywords;

CREATE TABLE backup_20240104_current.design_categories AS 
SELECT * FROM design_categories;

CREATE TABLE backup_20240104_current.design_mockups AS 
SELECT * FROM design_mockups;

-- Add metadata
COMMENT ON SCHEMA backup_20240104_current IS 'Backup created before restoration attempt';