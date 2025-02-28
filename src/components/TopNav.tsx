import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

export default function TopNav() {
  const { signOut, user } = useAuth();
  const { profile, loading } = useUserProfile();

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Print Files Manager</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {!loading && (
              <Link 
                to="/settings" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-50"
                title={`Role: ${profile?.role || 'unknown'}`}
              >
                <span className="text-gray-700">{profile?.username || user?.email}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  'bg-purple-100 text-purple-800'
                }`}>
                  admin
                </span>
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}