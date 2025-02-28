/*
  # Fix Storage Configuration
  
  1. Changes
    - Reset bucket to public state
    - Clean up and recreate policies
    - Handle existing policy cases
  
  2. Security
    - Public read access for files
    - Upload restricted to authenticated users
    - Delete restricted to file owners
*/

-- Reset bucket to public (this was the working state)
UPDATE storage.buckets
SET public = true
WHERE id = 'designs';

-- Drop policies that we know might exist (except the working delete policy)
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create/update the policies we need
DO $$
BEGIN
    -- Create public access policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'designs');
    END IF;

    -- Create upload policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload files'
    ) THEN
        CREATE POLICY "Authenticated users can upload files"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'designs');
    END IF;
END $$;