import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserWithDetails, UserDetails, UserRole } from '../types/users';

export function useUsers() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      console.group('🔄 Loading users');
      console.log('Getting user roles...');

      // First get all users with their roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        console.error('❌ Error fetching user roles:', rolesError);
        throw rolesError;
      }

      console.log('✅ User roles fetched:', userRoles);

      // Then get user details
      console.log('Getting user details...');
      const { data: userDetails, error: detailsError } = await supabase
        .from('user_details')
        .select('*');

      if (detailsError) {
        console.error('❌ Error fetching user details:', detailsError);
        throw detailsError;
      }

      console.log('✅ User details fetched:', userDetails);

      // Create a map of user details by ID
      const detailsMap = new Map(
        userDetails?.map(details => [details.id, details]) || []
      );

      // Transform the data
      console.log('🔄 Transforming user data...');
      const transformedUsers = userRoles?.map(user => {
        return {
          id: user.user_id,
          email: user.email,
          role: user.role,
          details: detailsMap.get(user.user_id) || null
        };
      }) || [];

      console.log('✅ Transformed users:', transformedUsers);
      setUsers(transformedUsers);
      console.groupEnd();
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      console.group('🔄 Updating user role');
      console.log('User ID:', userId);
      console.log('New role:', role);

      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating role:', error);
        throw error;
      }

      console.log('✅ Role updated successfully');
      await loadUsers();
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      console.groupEnd();
      return false;
    }
  };

  const updateUserDetails = async (userId: string, details: Partial<UserDetails>) => {
    try {
      console.group('🔄 Updating user details');
      console.log('User ID:', userId);
      console.log('New details:', details);

      const { error } = await supabase
        .from('user_details')
        .upsert({ id: userId, ...details });

      if (error) {
        console.error('❌ Error updating details:', error);
        throw error;
      }

      console.log('✅ Details updated successfully');
      await loadUsers();
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('Error updating user details:', error);
      console.groupEnd();
      return false;
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    updateUserRole,
    updateUserDetails,
    refresh: loadUsers
  };
}