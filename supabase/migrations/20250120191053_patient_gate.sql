-- First ensure we have the correct user types
INSERT INTO user_types (name, code, description)
VALUES 
    ('Super Admin', 'super_admin', 'Full system access and control'),
    ('Admin', 'admin', 'System administration access'),
    ('Vendor', 'vendor', 'Business account with vendor tools'),
    ('Designer', 'designer', 'Vendor with designer tool access'),
    ('Staff', 'staff', 'Staff member assigned to a vendor'),
    ('User', 'user', 'Standard user account')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Get user and type IDs
DO $$ 
DECLARE
    v_user_id uuid;
    v_super_admin_type_id uuid;
BEGIN
    -- Get user ID for jareds.smith@gmail.com
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'jareds.smith@gmail.com';

    -- Get super_admin type ID
    SELECT id INTO v_super_admin_type_id
    FROM user_types
    WHERE code = 'super_admin';

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

-- Update get_user_type function to handle no assignments
CREATE OR REPLACE FUNCTION get_user_type(user_id uuid)
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
        SELECT 1 FROM user_type_assignments WHERE user_id = $1
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
    WHERE uta.user_id = $1;
END;
$$;