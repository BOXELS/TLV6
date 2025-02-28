/*
  # Create user types and relationships tables

  1. New Tables
    - `user_types` - Stores user type definitions and hierarchies
    - `user_type_assignments` - Links users to their types with additional metadata
    - `user_relationships` - Manages hierarchical relationships between users

  2. Changes
    - Adds constraints and triggers to maintain data integrity
    - Adds RLS policies for proper access control
*/

-- Create user_types table
CREATE TABLE user_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    can_manage_users boolean DEFAULT false,
    can_manage_admins boolean DEFAULT false,
    can_manage_vendors boolean DEFAULT false,
    can_manage_designers boolean DEFAULT false,
    can_manage_staff boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create user_type_assignments table
CREATE TABLE user_type_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    type_id uuid REFERENCES user_types ON DELETE RESTRICT,
    assigned_by uuid REFERENCES auth.users,
    assigned_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE(user_id, type_id)
);

-- Create user_relationships table
CREATE TABLE user_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    child_user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    relationship_type text NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users,
    UNIQUE(parent_user_id, child_user_id),
    CHECK (parent_user_id != child_user_id),
    CHECK (relationship_type IN ('vendor_staff', 'designer_staff', 'admin_subadmin'))
);

-- Enable RLS
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_type_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "User types viewable by authenticated users"
    ON user_types FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only super admins can manage user types"
    ON user_types FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "User type assignments viewable by authenticated users"
    ON user_type_assignments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage user type assignments"
    ON user_type_assignments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'sub_admin')
        )
    );

CREATE POLICY "User relationships viewable by authenticated users"
    ON user_relationships FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view relationships they're part of"
    ON user_relationships FOR SELECT
    TO authenticated
    USING (
        parent_user_id = auth.uid()
        OR child_user_id = auth.uid()
    );

CREATE POLICY "Admins can manage relationships"
    ON user_relationships FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'sub_admin')
        )
    );

-- Insert default user types
INSERT INTO user_types (name, code, can_manage_users, can_manage_admins, can_manage_vendors, can_manage_designers, can_manage_staff) VALUES
    ('Super Admin', 'admin', true, true, true, true, true),
    ('Sub Admin', 'sub_admin', true, false, true, true, true),
    ('Vendor', 'vendor', false, false, false, false, true),
    ('Designer', 'designer', false, false, false, false, true),
    ('Staff', 'staff', false, false, false, false, false);

-- Create function to manage user relationships
CREATE OR REPLACE FUNCTION manage_user_relationship(
    p_parent_id uuid,
    p_child_id uuid,
    p_relationship_type text,
    p_action text -- 'add' or 'remove'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify user has permission
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'sub_admin')
    ) THEN
        RAISE EXCEPTION 'Not authorized to manage user relationships';
    END IF;

    -- Handle the action
    IF p_action = 'add' THEN
        INSERT INTO user_relationships (
            parent_user_id,
            child_user_id,
            relationship_type,
            created_by
        )
        VALUES (
            p_parent_id,
            p_child_id,
            p_relationship_type,
            auth.uid()
        );
    ELSIF p_action = 'remove' THEN
        DELETE FROM user_relationships
        WHERE parent_user_id = p_parent_id
        AND child_user_id = p_child_id;
    ELSE
        RAISE EXCEPTION 'Invalid action. Must be ''add'' or ''remove''';
    END IF;
END;
$$;