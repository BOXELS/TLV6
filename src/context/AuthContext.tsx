import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/users';

type AuthContextType = {
  session: Session | null;
  user: (User & { role?: UserRole }) | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.group('🔄 Auth Session Check');
      console.log('Initial Session:', session?.user?.email);

      setSession(session);
      if (session) {
        console.log('Setting up admin role for:', session.user.email);

        // Set user role as admin
        const { error } = supabase
          .from('user_roles')
          .upsert({
            user_id: session.user.id,
            email: session.user.email,
            role: 'admin'
          });

        if (error) {
          console.error('Error setting user role:', error);
        }

        // Set user with admin role
        setUser({
          ...session.user,
          role: 'admin'
        });

      } else {
        console.log('No session, clearing user');
        setUser(null);
      }
      console.groupEnd();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session?.user?.email);
      setSession(session);
      if (session) {
        // Always set user as admin
        setUser({
          ...session.user,
          role: 'admin'
        });
      } else {
        console.log('Session ended, clearing user');
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    signOut: () => supabase.auth.signOut(),
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
