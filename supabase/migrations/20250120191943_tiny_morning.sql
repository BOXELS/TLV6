-- Drop existing functions to start fresh
DROP FUNCTION IF EXISTS get_user_type(uuid);
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_super_admin();

-- Create simplified function to get user type
CREATE OR REPLACE FUNCTION get_user_type(p_user_id uuid)
RETURNS TABLE (
    type_code text,
    organization_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- First check if user has any assignments
    IF NOT EXISTS (
        SELECT 1 FROM user_type_assignments WHERE user_id = p_user_id
    ) THEN
        -- Return 'user' as default type
        RETURN QUERY SELECT 'user'::text, NULL::uuid;
        RETURN;
    END IF;

    -- Return all user types
    RETURN QUERY
    SELECT DISTINCT
        ut.code::text,
        uta.organization_id
    FROM user_type_assignments uta
    JOIN user_types ut ON uta.type_id = ut.id
    WHERE uta.user_id = p_user_id;
END;
$$;

-- Create simplified admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code IN ('admin', 'super_admin')
    );
$$;

-- Create simplified super admin check function
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = auth.uid()
        AND ut.code = 'super_admin'
    );
$$;

-- Ensure specific user has super_admin type
DO $$ 
DECLARE
    v_user_id uuid;
    v_super_admin_type_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'jareds.smith@gmail.com';

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User not found, skipping assignment';
        RETURN;
    END IF;

    -- Get super_admin type ID
    SELECT id INTO v_super_admin_type_id
    FROM user_types
    WHERE code = 'super_admin';

    IF v_super_admin_type_id IS NULL THEN
        RAISE NOTICE 'Super admin type not found, skipping assignment';
        RETURN;
    END IF;

    -- Add super_admin assignment if it doesn't exist
    INSERT INTO user_type_assignments (
        user_id,
        type_id,
        assigned_at
    ) VALUES (
        v_user_id,
        v_super_admin_type_id,
        now()
    )
    ON CONFLICT (user_id, type_id) DO NOTHING;
END $$;