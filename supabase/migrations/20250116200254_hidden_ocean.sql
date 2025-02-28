-- Set specific user as super_admin
UPDATE user_roles 
SET role = 'super_admin'
WHERE email = 'jareds.smith@gmail.com';

-- Create function to add super admin
CREATE OR REPLACE FUNCTION add_super_admin(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE user_roles 
    SET role = 'super_admin'
    WHERE email = p_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with email % not found', p_email;
    END IF;
END;
$$;