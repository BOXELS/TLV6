/*
  # Simplify Storage Policies
  
  1. Changes
    - Reset bucket to public
    - Simplify policies to basic working state
    - Remove complex checks that may be causing issues
  
  2. Security
    - Maintain public read access
    - Basic auth checks for uploads
*/

-- Reset bucket to public state
UPDATE storage.buckets
SET public = true
WHERE id = 'designs';

-- Drop all existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create simple working policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'designs');

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'designs');

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'designs' AND owner = auth.uid());