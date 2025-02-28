-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS user_info;

-- Recreate the materialized view with proper indexes
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

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_user_info_user_id ON user_info(user_id);

-- Create function to refresh the view
CREATE OR REPLACE FUNCTION refresh_user_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_info;
    RETURN NULL;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS refresh_user_info_roles ON user_roles;
DROP TRIGGER IF EXISTS refresh_user_info_details ON user_details;

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