-- Reset bucket configuration
UPDATE storage.buckets
SET public = true,
    file_size_limit = 52428800, -- 50MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/svg+xml']
WHERE id = 'designs';

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create new policies with proper permissions
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'designs');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'designs'
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'designs'
    AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'designs'
    AND owner = auth.uid()
);