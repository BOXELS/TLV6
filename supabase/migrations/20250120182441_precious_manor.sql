-- Set specific user as super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE email = 'jareds.smith@gmail.com';

-- Create function to ensure first user is super_admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If this is the first user, make them super_admin
    IF NOT EXISTS (SELECT 1 FROM user_roles) THEN
        INSERT INTO user_roles (user_id, email, role)
        VALUES (NEW.id, NEW.email, 'super_admin');
    ELSE
        -- Otherwise, insert as regular user
        INSERT INTO user_roles (user_id, email, role)
        VALUES (NEW.id, NEW.email, 'user');
    END IF;
    
    RETURN NEW;
END;
$$;