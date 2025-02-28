-- First ensure the user_role enum includes super_admin
DO $$ 
BEGIN
    -- Add super_admin if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'user_role'
        AND e.enumlabel = 'super_admin'
    ) THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
    END IF;
END $$;

-- Update any existing admin users to have the correct role type
UPDATE user_roles
SET role = 'admin'::user_role
WHERE role::text = 'super_admin';

-- Now set specific users back to super_admin
UPDATE user_roles
SET role = 'super_admin'::user_role
WHERE user_id = auth.uid()
AND role = 'admin'::user_role;