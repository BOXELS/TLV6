import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Check if user has admin or super_admin type
    const hasAdminAccess = user.type?.code === 'admin' || user.type?.code === 'super_admin';
    console.log('🔑 Admin Access Check:', {
      email: user.email,
      type: user.type?.code,
      hasAccess: hasAdminAccess
    });
    
    setIsAdmin(hasAdminAccess);
    setLoading(false);
  }, [user]);

  return { isAdmin, loading, error };
}