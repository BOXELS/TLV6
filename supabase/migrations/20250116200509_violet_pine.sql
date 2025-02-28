-- First ensure the user exists in user_roles
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users 
WHERE email = 'jared@boxels.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'super_admin';

-- Drop and recreate the function with proper error handling
CREATE OR REPLACE FUNCTION add_super_admin(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- First get the user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found with email %', p_email;
    END IF;

    -- Then update or insert the role
    INSERT INTO user_roles (user_id, email, role)
    VALUES (v_user_id, p_email, 'super_admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'super_admin';
END;
$$;