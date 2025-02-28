-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    role text NOT NULL DEFAULT 'user',
    email text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "View roles policy"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Manage roles policy"
ON user_roles FOR ALL
TO authenticated
USING (
    -- Allow users to manage their own role
    user_id = auth.uid()
    OR
    -- Or if they are an admin (direct check)
    (
        SELECT role = 'admin'
        FROM user_roles
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT role
        FROM user_roles
        WHERE user_id = p_user_id
        LIMIT 1
    );
END;
$$;