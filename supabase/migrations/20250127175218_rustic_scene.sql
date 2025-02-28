-- Drop existing materialized view and related objects
DROP TRIGGER IF EXISTS refresh_user_info_roles ON user_roles;
DROP TRIGGER IF EXISTS refresh_user_info_details ON user_details;
DROP FUNCTION IF EXISTS refresh_user_info();
DROP MATERIALIZED VIEW IF EXISTS user_info;

-- Recreate materialized view with proper unique index
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

-- Create unique index required for concurrent refresh
CREATE UNIQUE INDEX user_info_user_id_unique 
ON user_info(user_id);

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