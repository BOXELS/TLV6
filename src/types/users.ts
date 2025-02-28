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
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
};

export type UserType = {
  id: string;
  name: string;
  code: 'super_admin' | 'admin' | 'staff' | 'vendor' | 'designer' | 'user';
  can_manage_users: boolean;
  can_manage_admins: boolean;
  can_manage_vendors: boolean;
  can_manage_designers: boolean;
  can_manage_staff: boolean;
};

export type UserTypeAssignment = {
  id: string;
  user_id: string;
  type_id: string;
  assigned_by: string | null;
  assigned_at: string;
  metadata: Record<string, any>;
};

export type UserWithDetails = {
  id: string;
  email: string | null;
  type: UserType;
  last_login: string | null;
  details: UserDetails | null;
};

export function isValidUserType(code: string): code is UserType['code'] {
  return ['super_admin', 'admin', 'staff', 'vendor', 'designer', 'user'].includes(code);
}