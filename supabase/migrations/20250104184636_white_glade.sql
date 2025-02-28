/*
  # Add User Details Table

  1. New Tables
    - `user_details`
      - `id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `address_line1` (text)
      - `address_line2` (text)
      - `city` (text)
      - `state` (text)
      - `zip` (text)
      - `phone` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access and admin management
*/

-- Create user_details table
CREATE TABLE user_details (
    id uuid PRIMARY KEY REFERENCES auth.users,
    first_name text,
    last_name text,
    address_line1 text,
    address_line2 text,
    city text,
    state text,
    zip text,
    phone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_details ENABLE ROW LEVEL SECURITY;

-- Policies for user_details
CREATE POLICY "Users can view own details"
    ON user_details FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all user details"
    ON user_details FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

CREATE POLICY "Admins can manage user details"
    ON user_details FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    ));

-- Update trigger for updated_at
CREATE TRIGGER update_user_details_updated_at
    BEFORE UPDATE ON user_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();