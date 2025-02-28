/*
  # Create storage bucket for design files

  1. New Storage
    - Creates 'designs' bucket for storing print files and mockups
  2. Security
    - Enable public access for viewing files
    - Restrict uploads to authenticated users only
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', true);

-- Policy for viewing files (public access)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'designs');

-- Policy for uploading files (authenticated users only)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'designs'
  AND auth.role() = 'authenticated'
);

-- Policy for deleting files (file owner only)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'designs'
  AND owner = auth.uid()
);