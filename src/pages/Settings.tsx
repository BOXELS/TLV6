import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Account Settings</h2>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <p className="mt-1 text-sm text-gray-500">
                Update your password to keep your account secure.
              </p>
              <button
                onClick={() => {
                  // Implement password change functionality
                }}
                className="mt-3 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}