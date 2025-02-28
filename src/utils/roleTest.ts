import { supabase } from '../lib/supabase'; 

export async function testUserRole(email: string) {
  console.group('🔍 Testing User Role');
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth User:', {
      id: user?.id,
      email: user?.email,
      error: authError
    });

    if (!user) {
      console.error('❌ No authenticated user found');
      console.groupEnd();
      return;
    }

    // Set admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        email: user.email,
        role: 'admin'
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (roleError) {
      console.error('Error setting user role:', roleError);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.groupEnd();
  }
}