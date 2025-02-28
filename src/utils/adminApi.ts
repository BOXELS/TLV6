import { supabase } from '../lib/supabase';

export async function createUser(data: {
  email: string;
  password: string;
  vendorType?: VendorType;
  details: {
    first_name?: string;
    last_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  };
}) {
  try {
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('email', data.email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'admin' // All users are admins now
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Failed to create user');

    // Add user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin',
        email: data.email // Store email for reference
      });

    if (roleError) throw roleError;

    // Add user details if provided
    if (Object.keys(data.details).some(key => !!data.details[key as keyof typeof data.details])) {
      const { error: detailsError } = await supabase
        .from('user_details')
        .insert({
          id: authData.user.id,
          ...data.details
        });

      if (detailsError) throw detailsError;
    }

    return authData.user;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}