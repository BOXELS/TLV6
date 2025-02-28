import { supabase, adminSupabase } from '../lib/supabase';
import type { UserDetails } from '../types/users';
import toast from 'react-hot-toast';

export async function createUser(data: {
  email: string;
  password: string;
  typeId: string;
  details: Partial<UserDetails>;
}) {
  if (!adminSupabase) {
    console.error('❌ Admin client not initialized - missing service role key');
    toast.error('Missing admin permissions');
    return;
  }

  try {
    // First check if user exists
    const { data: existingUser } = await adminSupabase
      .from('user_type_assignments')
      .select('user_id')
      .eq('user_id', data.email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create auth user with admin client
    const { data: authData, error: signUpError } = await adminSupabase.auth
      .signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Failed to create user');

    // Add user type assignment
    const { error: assignmentError } = await adminSupabase
      .from('user_type_assignments')
      .insert({
        user_id: authData.user.id,
        type_id: data.typeId,
        assigned_at: new Date().toISOString()
      });

    if (assignmentError) throw assignmentError;

    // Add user details if provided
    const hasDetails = Object.entries(data.details).some(([_, value]) => !!value);
    if (hasDetails) {
      const { error: detailsError } = await adminSupabase
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