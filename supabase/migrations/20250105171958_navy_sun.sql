/*
  # Create backup storage bucket

  1. New Storage
    - Creates 'backups' bucket for storing system backups
    - Sets proper permissions and policies
  
  2. Security
    - Only authenticated users can view backups
    - Only admin users can create/delete backups
*/

-- Create the backups bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Policy for viewing backups (authenticated users only)
CREATE POLICY "Authenticated users can view backups"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'backups');

-- Policy for managing backups (admin users only)
CREATE POLICY "Admins can manage backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backups'
  AND EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.id = auth.uid() 
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backups'
  AND EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.id = auth.uid() 
    AND ur.role = 'admin'
  )
);