-- Drop and recreate get_user_type function with explicit table references
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

    RETURN QUERY
    SELECT 
        ut.code::text,
        uta.organization_id
    FROM user_type_assignments uta
    JOIN user_types ut ON uta.type_id = ut.id
    WHERE uta.user_id = p_user_id;
END;
$$;

-- Update is_admin function with explicit references
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

-- Update is_super_admin function with explicit references
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
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Get super_admin type ID
    SELECT id INTO v_super_admin_type_id
    FROM user_types
    WHERE code = 'super_admin';

    IF v_super_admin_type_id IS NULL THEN
        RAISE EXCEPTION 'Super admin type not found';
    END IF;

    -- Remove any existing assignments for this user
    DELETE FROM user_type_assignments
    WHERE user_id = v_user_id;

    -- Add super_admin assignment
    INSERT INTO user_type_assignments (
        user_id,
        type_id,
        assigned_at
    ) VALUES (
        v_user_id,
        v_super_admin_type_id,
        now()
    );

    -- Verify assignment
    IF NOT EXISTS (
        SELECT 1 
        FROM user_type_assignments uta
        JOIN user_types ut ON uta.type_id = ut.id
        WHERE uta.user_id = v_user_id
        AND ut.code = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Failed to assign super_admin type to user';
    END IF;
END $$;