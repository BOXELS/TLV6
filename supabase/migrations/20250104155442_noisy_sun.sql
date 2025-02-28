/*
  # Restore Working Storage Configuration
  
  1. Changes
    - Reset bucket to public state
    - Restore original working policies
    - Clean up any non-working policies
  
  2. Security
    - Public read access for designs bucket
    - Simple upload policy for authenticated users
    - Simple delete policy for file owners
*/

-- Reset bucket to public (the state when it was working)
UPDATE storage.buckets
SET public = true
WHERE id = 'designs';

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create the simple policies that were working before
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