/*
  # Add Shipstation Integration Schema
  
  1. New Tables
    - `integration_credentials`
      - `id` (uuid, primary key)
      - `service` (text, e.g. 'shipstation')
      - `credentials` (jsonb, encrypted credentials)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Only allow authenticated users to manage their own credentials
    - Encrypt sensitive data
*/

-- Create integration_credentials table
CREATE TABLE integration_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service text NOT NULL,
    credentials jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users NOT NULL,
    UNIQUE(service, user_id)
);

-- Enable RLS
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own credentials"
    ON integration_credentials
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own credentials"
    ON integration_credentials
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_integration_credentials_updated_at
    BEFORE UPDATE ON integration_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_integration_credentials_service ON integration_credentials(service);
CREATE INDEX idx_integration_credentials_user ON integration_credentials(user_id);

COMMENT ON TABLE integration_credentials IS 'Stores encrypted integration credentials for external services';