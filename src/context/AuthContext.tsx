import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserType } from '../types/users';

type AuthContextType = {
  session: Session | null;
  user: (User & { type?: UserType }) | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('🔄 AuthContext Version: 2025.02.20-4');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<(User & { type?: UserType }) | null>(null);

  const loadUserType = async (userId: string) => {
    console.group('🔍 Loading User Type');
    console.log('User ID:', userId);

    try {
      // First, get the user's type assignment
      console.log('🔄 Fetching user type assignment...');
      const { data: assignment, error: assignmentError } = await supabase
        .from('user_type_assignments')
        .select('type_id')
        .eq('user_id', userId)
        .single();

      if (assignmentError) {
        console.error('❌ Error fetching assignment:', assignmentError);
        console.groupEnd();
        return null;
      }

      if (!assignment) {
        console.warn('⚠️ No assignment found');
        console.groupEnd();
        return null;
      }

      console.log('📦 Found assignment:', assignment);

      // Then, get the user type details
      const { data: userType, error: typeError } = await supabase
        .from('user_types')
        .select('*')
        .eq('id', assignment.type_id)
        .single();

      if (typeError) {
        console.error('❌ Error fetching user type:', typeError);
        console.groupEnd();
        return null;
      }

      if (!userType) {
        console.warn('⚠️ No user type found');
        console.groupEnd();
        return null;
      }

      console.log('✅ Found user type:', {
        id: userType.id,
        name: userType.name,
        code: userType.code,
        permissions: {
          can_manage_users: userType.can_manage_users,
          can_manage_admins: userType.can_manage_admins,
          can_manage_vendors: userType.can_manage_vendors,
          can_manage_designers: userType.can_manage_designers,
          can_manage_staff: userType.can_manage_staff
        }
      });
      console.groupEnd();
      return userType as UserType;
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      console.groupEnd();
      return null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.group('🔄 Auth Session Check');
      console.log('Initial Session:', session?.user?.email);

      setSession(session);
      if (session) {
        console.log('🔑 User authenticated:', session.user.email);
        console.log('User ID:', session.user.id);
        
        const userType = await loadUserType(session.user.id);
        
        if (!userType) {
          console.warn('⚠️ No user type found for user:', session.user.email);
          // Debug query to check user_type_assignments
          const { data: assignments, error: assignError } = await supabase
            .from('user_type_assignments')
            .select('*')
            .eq('user_id', session.user.id);
          console.log('Current assignments:', assignments);
          console.log('Assignment query error:', assignError);

          // Debug query to check user_types
          const { data: types, error: typesError } = await supabase
            .from('user_types')
            .select('*');
          console.log('Available types:', types);
          console.log('Types query error:', typesError);
        }

        setUser({
          ...session.user,
          type: userType || undefined
        });
      } else {
        console.log('❌ No session, clearing user');
        setUser(null);
      }
      console.groupEnd();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.group('🔄 Auth State Change');
      console.log('Event Session:', session?.user?.email);
      setSession(session);
      if (session) {
        console.log('🔑 User authenticated:', session.user.email);
        const userType = await loadUserType(session.user.id);
        setUser({
          ...session.user,
          type: userType || undefined
        });
      } else {
        console.log('❌ Session ended, clearing user');
        setUser(null);
      }
      console.groupEnd();
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    signIn: async (email: string, password: string) => {
      console.group('🔐 Sign In Attempt');
      console.log('Email:', email);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error('❌ Sign in error:', error);
          throw error;
        }
        console.log('✅ Sign in successful:', data);
      } catch (error) {
        console.error('❌ Sign in exception:', error);
        throw error;
      } finally {
        console.groupEnd();
      }
    },
    signOut: async () => {
      console.group('🚪 Sign Out');
      const { error } = await supabase.auth.signOut();
      console.log('Sign out error:', error);
      console.groupEnd();
      return { error };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
