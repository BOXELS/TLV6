/*
  # Fix SSA Integration

  1. Changes
    - Add index for faster credential lookups
    - Add proper RLS policies for credentials
  
  2. Security
    - Ensure users can only access their own credentials
*/

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_credentials_user_service 
ON integration_credentials(user_id, service);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own credentials" ON integration_credentials;
DROP POLICY IF EXISTS "Users can manage their own credentials" ON integration_credentials;

-- Create new policies
CREATE POLICY "Users can view their own credentials"
ON integration_credentials FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own credentials"
ON integration_credentials FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add constraint to ensure service is lowercase
ALTER TABLE integration_credentials
ADD CONSTRAINT integration_credentials_service_check
CHECK (service = lower(service));

-- Convert existing service values to lowercase
UPDATE integration_credentials
SET service = lower(service);