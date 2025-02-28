import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ShipstationCredentials } from '../types/shipstation';

export function useShipstationCredentials() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ShipstationCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('integration_credentials')
        .select('credentials')
        .eq('service', 'shipstation')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No credentials found
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data) {
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Error checking Shipstation connection:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return { credentials, loading, error };
}