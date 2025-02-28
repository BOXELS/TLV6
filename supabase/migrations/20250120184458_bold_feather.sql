-- Ensure we have all required user types
INSERT INTO user_types (name, code, can_manage_users, can_manage_admins, can_manage_vendors, can_manage_designers, can_manage_staff)
VALUES 
    ('Admin', 'admin', true, true, true, true, true),
    ('Staff', 'staff', false, false, false, false, false),
    ('Vendor', 'vendor', false, false, false, false, true),
    ('Designer', 'designer', false, false, false, false, false)
ON CONFLICT (code) DO UPDATE SET
    can_manage_users = EXCLUDED.can_manage_users,
    can_manage_admins = EXCLUDED.can_manage_admins,
    can_manage_vendors = EXCLUDED.can_manage_vendors,
    can_manage_designers = EXCLUDED.can_manage_designers,
    can_manage_staff = EXCLUDED.can_manage_staff;

-- Get admin type ID
WITH admin_type AS (
    SELECT id FROM user_types WHERE code = 'admin'
)
-- Assign admin type to specific users
INSERT INTO user_type_assignments (user_id, type_id, assigned_at)
SELECT 
    au.id as user_id,
    at.id as type_id,
    now() as assigned_at
FROM auth.users au
CROSS JOIN admin_type at
WHERE au.email IN ('jareds.smith@gmail.com', 'jared@boxels.com')
ON CONFLICT (user_id, type_id) DO NOTHING;

-- Create function to get user type
CREATE OR REPLACE FUNCTION get_user_type(user_id uuid)
RETURNS TABLE (type_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT ut.code::text
    FROM user_type_assignments uta
    JOIN user_types ut ON uta.type_id = ut.id
    WHERE uta.user_id = $1;
END;
$$;