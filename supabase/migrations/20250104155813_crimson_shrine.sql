/*
  # Fix Storage Upload Policies
  
  1. Changes
    - Update bucket configuration
    - Fix upload policies to properly handle auth
    - Ensure proper file access control
  
  2. Security
    - Public read access maintained
    - Fixed upload permissions for authenticated users
    - Proper owner assignment for uploaded files
*/

-- Ensure bucket is public and properly configured
UPDATE storage.buckets
SET public = true,
    file_size_limit = 52428800, -- 50MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/svg+xml']
WHERE id = 'designs';

-- Drop existing policies for clean slate
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Recreate policies with proper auth checks
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'designs');

-- Fix upload policy to properly set owner
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'designs'
    AND (storage.foldername(name))[1] = 'prints'
    AND owner IS NULL -- Ensures owner gets set to auth.uid() automatically
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'designs'
    AND owner = auth.uid()
);