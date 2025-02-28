/*
  # Fix storage permissions

  1. Changes
    - Set bucket to private
    - Add proper RLS policies for authenticated users
    - Simplify policy structure
  
  2. Security
    - Ensure only authenticated users can access files
    - Maintain bucket privacy
*/

-- Reset bucket to private
UPDATE storage.buckets
SET public = false
WHERE id = 'designs';

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can access files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Create new policies
CREATE POLICY "Authenticated users can view files"
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