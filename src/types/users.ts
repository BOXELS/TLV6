// Simplified role system - everyone is admin
export type UserRole = 'admin';

// Add helper to validate role values
export function isValidRole(role: string): role is UserRole {
  return role === 'admin';
}

export type VendorStatus = 'pending' | 'approved' | 'rejected';

export type VendorType = 'business' | 'designer';

export type VendorProfile = {
  id: string;
  business_name: string;
  business_email: string;
  vendor_type: VendorType;
  parent_vendor_id?: string; // For staff members, references their vendor
  business_phone?: string;
  business_address?: string;
  business_city?: string;
  business_state?: string;
  business_zip?: string;
  tax_id?: string;
  status: VendorStatus;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
};

export type UserDetails = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type UserWithDetails = {
  id: string;
  email: string;
  role: UserRole;
  last_login: string | null;
  details: UserDetails | null;
};