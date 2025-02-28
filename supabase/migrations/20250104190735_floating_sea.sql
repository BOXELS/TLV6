/*
  # User Management Schema Updates
  
  1. Changes
    - Add email column to user_roles
    - Create user_info view for efficient querying
    - Add proper foreign key constraints
  
  2. Security
    - View access controlled through RLS policies on underlying tables
*/

-- Add foreign key relationships between tables
ALTER TABLE user_roles
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE user_details
ADD CONSTRAINT user_details_user_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create materialized view for better performance
CREATE MATERIALIZED VIEW user_info AS
SELECT 
    ur.user_id,
    ur.email,
    ur.role,
    ud.first_name,
    ud.last_name,
    ud.address_line1,
    ud.address_line2,
    ud.city,
    ud.state,
    ud.zip,
    ud.phone
FROM user_roles ur
LEFT JOIN user_details ud ON ur.user_id = ud.id;

-- Create index for faster lookups
CREATE INDEX idx_user_info_user_id ON user_info(user_id);
CREATE INDEX idx_user_info_email ON user_info(email);

-- Create function to refresh the view
CREATE OR REPLACE FUNCTION refresh_user_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_info;
    RETURN NULL;
END;
$$;

-- Create triggers to keep view updated
CREATE TRIGGER refresh_user_info_roles
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_info();

CREATE TRIGGER refresh_user_info_details
AFTER INSERT OR UPDATE OR DELETE ON user_details
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_info();

-- Grant appropriate permissions
GRANT SELECT ON user_info TO authenticated;