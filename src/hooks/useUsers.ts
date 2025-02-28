import { useState, useEffect } from 'react';
import { supabase, adminSupabase } from '../lib/supabase';
import type { UserWithDetails, UserDetails, UserType } from '../types/users';
import toast from 'react-hot-toast';

export function useUsers() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    if (!adminSupabase) {
      console.error('❌ Admin client not initialized - missing service role key');
      toast.error('Missing admin permissions');
      setLoading(false);
      return;
    }

    try {
      console.group('🔄 Loading users');
      console.log('Getting user types and assignments...');

      // Get all users with their type assignments and details
      const { data: assignments, error: assignmentsError } = await adminSupabase
        .from('user_type_assignments')
        .select(`
          user_id,
          type_id,
          user_types!inner (
            id,
            name,
            code,
            can_manage_users,
            can_manage_admins,
            can_manage_vendors,
            can_manage_designers,
            can_manage_staff
          )
        `);

      if (assignmentsError) {
        console.error('❌ Error fetching user assignments:', assignmentsError);
        throw assignmentsError;
      }

      // Get auth users data using admin client
      const { data: authUsers, error: authError } = await adminSupabase.auth
        .admin
        .listUsers();

      if (authError) {
        console.error('❌ Error fetching auth users:', authError);
        throw authError;
      }

      // Create a map of auth users by ID
      const authMap = new Map(
        authUsers?.users?.map(user => [user.id, user]) || []
      );

      console.log('✅ User assignments and auth data fetched');

      // Then get user details
      console.log('Getting user details...');
      const { data: userDetails, error: detailsError } = await adminSupabase
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
      const transformedUsers = assignments?.map(assignment => {
        const authUser = authMap.get(assignment.user_id);
        const userType = assignment.user_types as unknown as UserType;
        return {
          id: assignment.user_id,
          email: authUser?.email || null,
          type: userType,
          last_login: authUser?.last_sign_in_at || null,
          details: detailsMap.get(assignment.user_id) || null
        };
      }) || [];

      console.log('✅ Transformed users:', transformedUsers);
      setUsers(transformedUsers);
      console.groupEnd();
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserType = async (userId: string, typeId: string) => {
    if (!adminSupabase) {
      console.error('❌ Admin client not initialized - missing service role key');
      toast.error('Missing admin permissions');
      return false;
    }

    try {
      console.group('🔄 Updating user type');
      console.log('User ID:', userId);
      console.log('New type ID:', typeId);

      const { error } = await adminSupabase
        .from('user_type_assignments')
        .upsert({ 
          user_id: userId,
          type_id: typeId,
          assigned_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error updating type:', error);
        throw error;
      }

      console.log('✅ Type updated successfully');
      await loadUsers();
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('Error updating user type:', error);
      console.groupEnd();
      return false;
    }
  };

  const updateUserDetails = async (userId: string, details: Partial<UserDetails>) => {
    if (!adminSupabase) {
      console.error('❌ Admin client not initialized - missing service role key');
      toast.error('Missing admin permissions');
      return false;
    }

    try {
      console.group('🔄 Updating user details');
      console.log('User ID:', userId);
      console.log('New details:', details);

      const { error } = await adminSupabase
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
    updateUserType,
    updateUserDetails,
    refresh: loadUsers
  };
}