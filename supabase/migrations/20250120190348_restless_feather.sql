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

-- Get super_admin type ID
WITH super_admin_type AS (
    SELECT id FROM user_types WHERE code = 'super_admin'
)
-- Also assign super_admin type to these users
INSERT INTO user_type_assignments (user_id, type_id, assigned_at)
SELECT 
    au.id as user_id,
    sat.id as type_id,
    now() as assigned_at
FROM auth.users au
CROSS JOIN super_admin_type sat
WHERE au.email IN ('jareds.smith@gmail.com', 'jared@boxels.com')
ON CONFLICT (user_id, type_id) DO NOTHING;

-- Verify assignments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        JOIN auth.users au ON uta.user_id = au.id
        WHERE au.email IN ('jareds.smith@gmail.com', 'jared@boxels.com')
        AND ut.code IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Failed to assign admin types to required users';
    END IF;
END $$;