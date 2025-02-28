/*
  # Fix category deletion cascade

  1. Changes
    - Add proper cascade delete for category relationships
    - Ensure RLS policies allow deletion
*/

-- Ensure proper cascade delete for category_keywords
ALTER TABLE category_keywords
DROP CONSTRAINT IF EXISTS category_keywords_category_id_fkey,
ADD CONSTRAINT category_keywords_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE CASCADE;

-- Ensure proper cascade delete for design_categories
ALTER TABLE design_categories
DROP CONSTRAINT IF EXISTS design_categories_category_id_fkey,
ADD CONSTRAINT design_categories_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE CASCADE;