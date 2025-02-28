-- Reset bucket configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete backups" ON storage.objects;

-- Create simplified admin-only policies
CREATE POLICY "Admin backup access"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'backups'
    AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    bucket_id = 'backups'
    AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);