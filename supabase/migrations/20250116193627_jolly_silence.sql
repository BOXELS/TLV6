-- First, update the email in user_roles to match auth.users
UPDATE user_roles
SET email = 'jareds.smith@gmail.com'
WHERE user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8';

-- Ensure role is super_admin
UPDATE user_roles
SET role = 'super_admin'
WHERE user_id = '4259afda-05ff-4679-aae2-fb87cebdfea8';

-- Create function to sync user_roles email with auth.users
CREATE OR REPLACE FUNCTION sync_user_roles_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE user_roles
    SET email = NEW.email
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$;

-- Create trigger to keep emails in sync
DROP TRIGGER IF EXISTS sync_user_roles_email_trigger ON auth.users;
CREATE TRIGGER sync_user_roles_email_trigger
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_roles_email();

-- Create function to auto-create user_role on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_roles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Sync any missing emails from auth.users to user_roles
UPDATE user_roles ur
SET email = au.email
FROM auth.users au
WHERE ur.user_id = au.id
AND ur.email IS NULL;