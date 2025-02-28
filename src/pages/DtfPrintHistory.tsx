import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { getDtfPrintLists } from '../utils/dtfPrintList';
import type { DtfPrintList } from '../types/dtf';
import DtfPrintHistoryList from '../components/shipstation/DtfPrintHistoryList';
import { useShipstationCredentials } from '../hooks/useShipstationCredentials';
import toast from 'react-hot-toast';

export default function DtfPrintHistory() {
  const { user } = useAuth();
  const { credentials } = useShipstationCredentials();
  const [printLists, setPrintLists] = useState<DtfPrintList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPrintLists();
    }
  }, [user]);

  const loadPrintLists = async () => {
    if (!user) return;

    try {
      const lists = await getDtfPrintLists(user.id);
      setPrintLists(lists);
    } catch (error) {
      console.error('Error loading print lists:', error);
      toast.error('Failed to load print history');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          Please log in to view print history.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Printer className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">DTF Print History</h2>
          </div>
          <button
            onClick={loadPrintLists}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        <DtfPrintHistoryList 
          lists={printLists} 
          loading={loading} 
          credentials={credentials}
          onOrdersUpdated={loadPrintLists}
        />
      </div>
    </DashboardLayout>
  );
}