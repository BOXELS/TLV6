-- Drop old role-based functions
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_super_admin();

-- Create function to get user types
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
    RETURN QUERY
    SELECT 
        ut.code::text,
        uta.organization_id
    FROM user_type_assignments uta
    JOIN user_types ut ON uta.type_id = ut.id
    WHERE uta.user_id = $1;
END;
$$;

-- Create function to check admin access
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

-- Create function to check super admin access
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

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_type_id uuid;
BEGIN
    -- Get the user type ID
    SELECT id INTO v_user_type_id
    FROM user_types
    WHERE code = CASE 
        -- First user gets super_admin
        WHEN NOT EXISTS (SELECT 1 FROM user_type_assignments) THEN 'super_admin'
        -- Everyone else gets regular user
        ELSE 'user'
    END;

    -- Create the assignment
    INSERT INTO user_type_assignments (
        user_id,
        type_id,
        assigned_at
    ) VALUES (
        NEW.id,
        v_user_type_id,
        now()
    );
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

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

    -- Get super_admin type ID
    SELECT id INTO v_super_admin_type_id
    FROM user_types
    WHERE code = 'super_admin';

    -- Remove any existing assignments
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
    )
    ON CONFLICT (user_id, type_id) DO NOTHING;
END $$;