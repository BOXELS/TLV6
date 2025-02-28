/*
  # Fix user details relationship

  This migration adds proper foreign key relationships between user_roles and user_details tables.
*/

-- Add email column to user_roles if not exists
ALTER TABLE user_roles
ADD COLUMN IF NOT EXISTS email text;

-- Add foreign key from user_details to user_roles
ALTER TABLE user_details
DROP CONSTRAINT IF EXISTS user_details_id_fkey,
ADD CONSTRAINT user_details_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_details_id ON user_details(id);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view own details" ON user_details;
DROP POLICY IF EXISTS "Admins can view all user details" ON user_details;
DROP POLICY IF EXISTS "Admins can manage user details" ON user_details;

CREATE POLICY "Users can view own details"
    ON user_details FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can view all details"
    ON user_details FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'sub_admin')
        )
    );

CREATE POLICY "Users can manage own details"
    ON user_details FOR ALL
    TO authenticated
    USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'sub_admin')
    ));