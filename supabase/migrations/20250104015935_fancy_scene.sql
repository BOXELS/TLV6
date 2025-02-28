/*
  # Fix storage bucket permissions

  1. Changes
    - Update storage bucket policies to properly handle file uploads
    - Fix RLS policies for authenticated users
    - Add proper file access controls

  2. Security
    - Maintain private bucket with authenticated access
    - Allow authenticated users to upload files
    - Enable proper file management
*/

-- Reset bucket to private
UPDATE storage.buckets
SET public = false
WHERE id = 'designs';

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload and update files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create new simplified policies
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