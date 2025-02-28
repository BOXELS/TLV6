import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import ShipstationConnect from '../components/shipstation/ShipstationConnect';
import OrderStats from '../components/shipstation/OrderStats';
import OrderList from '../components/shipstation/OrderList';
import { fetchShipstationOrders } from '../utils/shipstationApi';
import type { ShipstationOrder, ShipstationCredentials } from '../types/shipstation';
import toast from 'react-hot-toast';

export default function Shipstation() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [orders, setOrders] = useState<ShipstationOrder[]>([]);
  const [credentials, setCredentials] = useState<ShipstationCredentials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('integration_credentials')
        .select('credentials')
        .eq('service', 'shipstation')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCredentials(data.credentials);
        setConnected(true);
        loadOrders(data.credentials);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setLoading(false);
    }
  };

  const loadOrders = async (credentials: ShipstationCredentials) => {
    try {
      const orders = await fetchShipstationOrders(credentials);
      setOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load Shipstation orders');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          Please log in to access Shipstation integration.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Shipstation Orders</h2>
          </div>
          {!loading && orders.length > 0 && (
            <OrderStats orders={orders} />
          )}
        </div>

        {/* Main Content */}
        {!connected ? (
          <ShipstationConnect />
        ) : (
          credentials && (
            <>
              {/* ✅ Debug Orders Before Rendering */}
              {console.log('🛠️ Orders before rendering OrderList:', orders.map(order => ({
                orderNumber: order.orderNumber,
                tags: Array.isArray(order.tags) ? order.tags : 'No tags array found'
              })))}

              {/* ✅ Render OrderList */}
              <OrderList 
                orders={orders} 
                loading={loading} 
                credentials={credentials} 
                onOrdersUpdated={() => loadOrders(credentials)} 
              />
            </>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
