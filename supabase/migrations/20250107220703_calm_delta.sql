-- Update user_role enum to include vendor
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendor';

-- Create vendors table
CREATE TABLE vendors (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name text NOT NULL,
    business_email text NOT NULL,
    business_phone text,
    business_address text,
    business_city text,
    business_state text,
    business_zip text,
    tax_id text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_at timestamptz,
    approved_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add vendor_id to design_files
ALTER TABLE design_files 
ADD COLUMN vendor_id uuid REFERENCES vendors(id);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for vendors table
CREATE POLICY "Vendors can view own profile"
ON vendors FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all vendors"
ON vendors FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can manage vendors"
ON vendors FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Update design_files policies to handle vendors
DROP POLICY IF EXISTS "Design files are viewable by authenticated users" ON design_files;
DROP POLICY IF EXISTS "Users can manage their own design files" ON design_files;

CREATE POLICY "Design files are viewable by admins and owners"
ON design_files FOR SELECT
TO authenticated
USING (
    uploaded_by = auth.uid()
    OR vendor_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Users can manage their own design files"
ON design_files FOR ALL
TO authenticated
USING (
    uploaded_by = auth.uid()
    OR vendor_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Add function to approve vendor
CREATE OR REPLACE FUNCTION approve_vendor(
    vendor_user_id uuid,
    admin_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify admin status
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = admin_user_id
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can approve vendors';
    END IF;

    -- Update vendor status
    UPDATE vendors
    SET status = 'approved',
        approved_at = now(),
        approved_by = admin_user_id
    WHERE id = vendor_user_id;

    -- Set vendor role
    INSERT INTO user_roles (user_id, role)
    VALUES (vendor_user_id, 'vendor')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'vendor';
END;
$$;