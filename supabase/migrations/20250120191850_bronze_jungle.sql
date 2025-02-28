-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_type(uuid);

-- Recreate the function with a properly named parameter
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