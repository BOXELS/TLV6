/*
  # Initial Schema Setup for File Management System

  1. New Tables
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, either 'admin' or 'staff')
      - `created_at` (timestamp)

    - `files`
      - `id` (uuid, primary key)
      - `name` (text)
      - `path` (text)
      - `size` (bigint)
      - `uploaded_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (text)

  2. Security
    - Enable RLS on all tables
    - Policies for user_roles:
      - Admins can read all roles
      - Staff can only read their own role
    - Policies for files:
      - Admins can perform all operations
      - Staff can read all files and upload new ones
*/

-- Create enum for roles
CREATE TYPE user_role AS ENUM ('admin', 'staff');

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    path text NOT NULL,
    size bigint NOT NULL,
    uploaded_by uuid REFERENCES auth.users NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    status text NOT NULL DEFAULT 'active',
    CONSTRAINT valid_status CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view their own role"
    ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON user_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies for files
CREATE POLICY "Users can view all files"
    ON files
    FOR SELECT
    USING (true);

CREATE POLICY "Users can upload files"
    ON files
    FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can update files"
    ON files
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete files"
    ON files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();