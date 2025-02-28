/*
  # Fix storage policies for file updates

  1. Changes
    - Update storage bucket policies to allow file updates
    - Add proper RLS for file modifications
    - Fix file ownership checks

  2. Security
    - Ensure users can only modify their own files
    - Maintain read access for authenticated users
*/

-- Update bucket to be private but allow authenticated access
UPDATE storage.buckets
SET public = false
WHERE id = 'designs';

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create new policies with proper checks
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'designs');

CREATE POLICY "Users can upload and update files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'designs'
  AND (
    -- Allow upload if user owns the design
    EXISTS (
      SELECT 1 FROM design_files
      WHERE uploaded_by = auth.uid()
      AND (
        storage.objects.name LIKE 'prints/' || sku || '.%'
        OR storage.objects.name LIKE 'prints/' || sku || '_web.%'
      )
    )
    -- Or if it's a new file
    OR NOT EXISTS (
      SELECT 1 FROM storage.objects
      WHERE name = storage.objects.name
    )
  )
);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'designs'
  AND EXISTS (
    SELECT 1 FROM design_files
    WHERE uploaded_by = auth.uid()
    AND (
      storage.objects.name LIKE 'prints/' || sku || '.%'
      OR storage.objects.name LIKE 'prints/' || sku || '_web.%'
    )
  )
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'designs'
  AND EXISTS (
    SELECT 1 FROM design_files
    WHERE uploaded_by = auth.uid()
    AND (
      storage.objects.name LIKE 'prints/' || sku || '.%'
      OR storage.objects.name LIKE 'prints/' || sku || '_web.%'
    )
  )
);