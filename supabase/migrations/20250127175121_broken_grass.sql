-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Set specific user as admin
UPDATE user_roles 
SET role = 'admin'
WHERE email = 'jareds.smith@gmail.com';

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Update handle_new_user function to properly handle first user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert new user with admin role if first user, otherwise regular user
    INSERT INTO user_roles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM user_roles) THEN 'admin'
            ELSE 'user'
        END
    );
    
    RETURN NEW;
END;
$$;