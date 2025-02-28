/*
  # Security improvements
  
  1. Changes
    - Set search_path explicitly for update_updated_at_column function
    - Add security definer and strict settings
  
  2. Security
    - Prevents search_path manipulation attacks
    - Ensures function runs with proper permissions
*/

-- Drop and recreate the function with proper security settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STRICT
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;