-- First remove any admin assignments for users who are super_admin
DELETE FROM user_type_assignments uta
USING user_types ut1, user_types ut2, user_type_assignments uta2
WHERE uta.user_id = uta2.user_id
AND uta.type_id = ut1.id
AND uta2.type_id = ut2.id
AND ut1.code = 'admin'
AND ut2.code = 'super_admin';

-- Get super_admin type ID
WITH super_admin_type AS (
    SELECT id FROM user_types WHERE code = 'super_admin'
)
-- Ensure specific users have super_admin type only
INSERT INTO user_type_assignments (user_id, type_id, assigned_at)
SELECT 
    au.id as user_id,
    sat.id as type_id,
    now() as assigned_at
FROM auth.users au
CROSS JOIN super_admin_type sat
WHERE au.email = 'jareds.smith@gmail.com'
ON CONFLICT (user_id, type_id) DO NOTHING;

-- Verify assignments
DO $$ 
DECLARE
    v_user_id uuid;
    v_type_count integer;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'jareds.smith@gmail.com';

    -- Count user's types
    SELECT COUNT(*) INTO v_type_count
    FROM user_type_assignments uta
    JOIN user_types ut ON uta.type_id = ut.id
    WHERE uta.user_id = v_user_id;

    -- Verify only one type (super_admin)
    IF v_type_count != 1 THEN
        RAISE EXCEPTION 'Expected 1 type assignment for user, found %', v_type_count;
    END IF;

    -- Verify it's super_admin
    IF NOT EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = v_user_id
        AND ut.code = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'User is missing super_admin type';
    END IF;
END $$;