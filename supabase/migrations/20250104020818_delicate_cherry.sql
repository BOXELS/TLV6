/*
  # Restore from previous working backup

  Restores the schema from the backup_20240105 schema that was working correctly
*/

-- Clear current tables
TRUNCATE TABLE design_files CASCADE;
TRUNCATE TABLE categories CASCADE;

-- Restore data from backup
INSERT INTO categories 
SELECT * FROM backup_20240105.categories;

INSERT INTO design_files 
SELECT * FROM backup_20240105.design_files;

INSERT INTO design_keywords 
SELECT * FROM backup_20240105.design_keywords;

INSERT INTO design_categories 
SELECT * FROM backup_20240105.design_categories;

INSERT INTO design_mockups 
SELECT * FROM backup_20240105.design_mockups;

-- Reset storage bucket to previous working state
UPDATE storage.buckets
SET public = true
WHERE id = 'designs';

-- Recreate working storage policies
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

CREATE POLICY "Authenticated users can access files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'designs');

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'designs');

CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'designs');

CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'designs');