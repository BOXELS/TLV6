-- Create the backups bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Drop any existing policies for the backups bucket
DROP POLICY IF EXISTS "Authenticated users can view backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete backups" ON storage.objects;

-- Create new policies with proper security checks
CREATE POLICY "Admins can view backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'backups'
    AND EXISTS (
        SELECT 1 FROM auth.users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = auth.uid() 
        AND ur.role = 'admin'
    )
);

CREATE POLICY "Admins can upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'backups'
    AND EXISTS (
        SELECT 1 FROM auth.users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = auth.uid() 
        AND ur.role = 'admin'
    )
);

CREATE POLICY "Admins can update backups"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'backups'
    AND EXISTS (
        SELECT 1 FROM auth.users u
        JOIN user_roles ur ON u.id = ur.user_id
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
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = auth.uid() 
        AND ur.role = 'admin'
    )
);