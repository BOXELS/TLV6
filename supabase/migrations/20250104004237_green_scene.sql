/*
  # Fix storage policies for design uploads

  1. Changes
    - Simplify storage policies to allow authenticated uploads
    - Remove complex checks that were causing authorization issues
    - Add proper bucket configuration
  
  2. Security
    - Maintain authentication requirement
    - Keep bucket private
    - Allow authenticated users to upload and view files
*/

-- Ensure bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Recreate policies with proper permissions
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;

-- Simple view policy for authenticated users
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'designs');

-- Simple upload policy for authenticated users
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'designs'
  AND auth.role() = 'authenticated'
);