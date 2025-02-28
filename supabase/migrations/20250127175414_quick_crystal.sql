-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Delete any existing role for the user to avoid conflicts
DELETE FROM user_roles
WHERE email = 'jareds.smith@gmail.com';

-- Insert admin role for specific user
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'jareds.smith@gmail.com';

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the handle_new_user function to be more explicit
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
            WHEN NEW.email = 'jareds.smith@gmail.com' THEN 'admin'
            ELSE 'user'
        END
    );
    
    RETURN NEW;
END;
$$;