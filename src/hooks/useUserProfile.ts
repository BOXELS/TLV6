import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

type UserProfile = {
  username: string;
};

export default function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        console.group('🚫 No user found');
        console.log('User object:', user);
        console.log('Clearing profile');
        console.groupEnd();
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        console.group('🔄 Loading user profile for', user.email);
        console.log('User ID:', user.id);
        console.log('User Type:', user.type?.name);
        
        // Extract username from email
        const username = user.email?.split('@')[0] || 'User';

        // Set profile
        setProfile({
          username
        });

        setError(null);
        console.groupEnd();
      } catch (error) {
        console.error('Error loading user profile:', error);
        console.log('Full error object:', error);
        console.groupEnd();
        
        // Set error state instead of using fallback
        setError(error instanceof Error ? error : new Error('Unknown error'));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  return { profile, loading, error };
}

export { useUserProfile }