import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import KeywordsList from '../components/keywords/KeywordsList';
import KeywordStats from '../components/keywords/KeywordStats';
import AddKeyword from '../components/keywords/AddKeyword';

export default function Keywords() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Keywords Management</h2>
          <AddKeyword />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <KeywordsList />
          </div>
          <div>
            <KeywordStats />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}