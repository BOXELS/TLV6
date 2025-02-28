/*
  # Update storage bucket security

  1. Changes
    - Make designs bucket private (not public)
    - Update policies to restrict access to authenticated users only
  2. Security
    - Only authenticated users can view files
    - Only file owners can upload and delete files
*/

-- Update the bucket to be private
UPDATE storage.buckets
SET public = false
WHERE id = 'designs';

-- Drop the public access policy
DROP POLICY IF EXISTS "Public Access"
ON storage.objects;

-- Create policy for viewing files (authenticated users only)
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'designs'
  AND (
    -- Users can view their own files
    auth.uid() = owner
    OR
    -- Or files they have access to through design_files
    EXISTS (
      SELECT 1 FROM design_files df
      WHERE df.uploaded_by = auth.uid()
      AND storage.objects.name LIKE 'prints/' || df.sku || '/%'
    )
  )
);

-- Update upload policy to be more specific
DROP POLICY IF EXISTS "Authenticated users can upload files"
ON storage.objects;

CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'designs'
  AND auth.role() = 'authenticated'
  -- Ensure users can only upload to their own directories
  AND (
    SELECT uploaded_by FROM design_files
    WHERE storage.objects.name LIKE 'prints/' || sku || '/%'
  ) = auth.uid()
);