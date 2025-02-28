import React, { useState } from 'react';
import { Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { validateSsaCredentials } from '../../utils/ssaApi';
import type { SsaCredentials } from '../../types/ssa';

export default function SsaConnect() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<SsaCredentials>({
    accountId: '536985',
    apiKey: 'c80e389c-39a3-4c79-9e48-1c9cf03bd9fe'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to connect S&S Activewear');
      return;
    }

    if (!credentials.accountId || !credentials.apiKey) {
      toast.error('Please enter both Account ID and API Key');
      return;
    }

    if (!credentials.accountId || !credentials.apiKey) {
      toast.error('Please enter both Account ID and API Key');
      return;
    }
    setLoading(true);

    try {
      // Validate credentials
      const isValid = await validateSsaCredentials(credentials);
      if (!isValid) {
        throw new Error('Invalid API credentials');
      }

      // Store encrypted credentials in Supabase
      const { error } = await supabase
        .from('integration_credentials')
        .upsert({
          service: 'ssa',
          credentials: credentials,
          user_id: user.id
        }, {
          onConflict: 'user_id,service'
        });

      if (error) throw error;
      toast.success('S&S Activewear connected successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to save credentials:', error);
      toast.error('Failed to connect to S&S Activewear');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <Key className="w-6 h-6 text-indigo-600" />
        <h2 className="text-lg font-medium">Connect to S&S Activewear</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account ID
          </label>
          <input
            type="text"
            value={credentials.accountId}
            onChange={(e) => setCredentials(prev => ({ ...prev, accountId: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="536985"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <input
            type="text"
            value={credentials.apiKey}
            onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="c80e389c-39a3-4c79-9e48-1c9cf03bd9fe"
            required
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Your account ID and API key are used to securely connect to your S&S Activewear account.
          </p>
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