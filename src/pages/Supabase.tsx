import React, { useState } from 'react';
import { Database, HardDrive } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import DatabaseBackup from '../components/supabase/DatabaseBackup';
import StorageBackup from '../components/supabase/StorageBackup';

type Tab = 'database' | 'storage';

export default function Supabase() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('database');


  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">Supabase Management</h2>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('database')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'database'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database
              </div>
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'storage'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Storage
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'database' && <DatabaseBackup />}
          {activeTab === 'storage' && <StorageBackup />}
        </div>
      </div>
    </DashboardLayout>
  );
}