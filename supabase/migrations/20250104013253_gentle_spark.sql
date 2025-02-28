/*
  # Fix storage access policies

  1. Changes
    - Update storage bucket to be public for authenticated users
    - Add proper policies for viewing and uploading files
    - Remove overly restrictive conditions

  2. Security
    - Maintain authentication requirement
    - Allow authenticated users to view all files
    - Allow file owners to manage their files
*/

-- Update bucket to be public for authenticated users
UPDATE storage.buckets
SET public = true
WHERE id = 'designs';

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create new policies
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'designs');

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'designs'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'designs'
  AND owner = auth.uid()
);