import React, { useState } from 'react';
import { Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { ShipstationCredentials } from '../../types/shipstation';

export default function ShipstationConnect() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ShipstationCredentials>({
    apiKey: '',
    apiSecret: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to connect Shipstation');
      return;
    }

    setLoading(true);

    try {
      // Store encrypted credentials in Supabase
      const { error } = await supabase
        .from('integration_credentials')
        .upsert({
          service: 'shipstation',
          credentials: credentials,
          user_id: user.id
        });

      if (error) throw error;
      toast.success('Shipstation connected successfully');
      window.location.reload(); // Reload to show orders
    } catch (error) {
      console.error('Failed to save credentials:', error);
      toast.error('Failed to connect to Shipstation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <Key className="w-6 h-6 text-indigo-600" />
        <h2 className="text-lg font-medium">Connect to Shipstation</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <input
            type="text"
            value={credentials.apiKey}
            onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            API Secret
          </label>
          <input
            type="password"
            value={credentials.apiSecret}
            onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </form>
    </div>
  );
}