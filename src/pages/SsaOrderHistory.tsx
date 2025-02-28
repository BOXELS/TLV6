import React from 'react';
import { Package } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function SsaOrderHistory() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">SSA Order History</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">Order history will be displayed here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}