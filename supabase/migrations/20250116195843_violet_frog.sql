-- Set specific user as super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE email = 'jareds.smith@gmail.com';

-- Create index for faster role lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_roles_email 
ON user_roles(email);

-- Ensure RLS policies allow the change
DO $$ 
BEGIN
    -- Temporarily disable RLS for this operation
    ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
    
    -- Perform the role update
    UPDATE user_roles 
    SET role = 'super_admin'
    WHERE email = 'jareds.smith@gmail.com';
    
    -- Re-enable RLS
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
END $$;