import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import SsaConnect from '../components/ssa/SsaConnect';
import SsaOrderList from '../components/ssa/SsaOrderList';
import { fetchSsaOrders } from '../utils/ssaApi';
import type { SsaOrder, SsaCredentials } from '../types/ssa';
import toast from 'react-hot-toast';

export default function SsaOrders() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [orders, setOrders] = useState<SsaOrder[]>([]);
  const [credentials, setCredentials] = useState<SsaCredentials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;

    console.log('Checking SSA connection for user:', user.id);
    try {
      const { data, error } = await supabase
        .from('integration_credentials')
        .select('credentials')
        .eq('service', 'ssa')
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

      console.log('SSA credentials response:', data);
      if (data) {
        setCredentials(data.credentials);
        setConnected(true);
        loadOrders(data.credentials);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking SSA connection:', error);
      setLoading(false);
    }
  };

  const loadOrders = async (credentials: SsaCredentials) => {
    try {
      const orders = await fetchSsaOrders(credentials);
      setOrders(orders);
    } catch (error) {
      console.error('Error loading SSA orders:', error);
      toast.error('Failed to load S&S Activewear orders');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          Please log in to access S&S Activewear integration.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">S&S Activewear Orders</h2>
        </div>

        {!connected ? (
          <SsaConnect />
        ) : (
          credentials && (
            <SsaOrderList 
              orders={orders} 
              loading={loading} 
              credentials={credentials}
              onOrdersUpdated={() => loadOrders(credentials)}
            />
          )
        )}
      </div>
    </DashboardLayout>
  );
}