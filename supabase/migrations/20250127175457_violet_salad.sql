-- Temporarily disable RLS
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Update existing role or insert new one
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'jareds.smith@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the handle_new_user function to handle conflicts
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert new user with admin role if first user or specific email
    INSERT INTO user_roles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM user_roles) THEN 'admin'
            WHEN NEW.email = 'jareds.smith@gmail.com' THEN 'admin'
            ELSE 'user'
        END
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET role = CASE 
        WHEN EXCLUDED.email = 'jareds.smith@gmail.com' THEN 'admin'
        ELSE EXCLUDED.role
    END;
    
    RETURN NEW;
END;
$$;