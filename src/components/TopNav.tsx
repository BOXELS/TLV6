import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

const getTypeStyles = (code: string) => {
  switch (code) {
    case 'super_admin':
      return 'bg-purple-900 text-white';
    case 'admin':
      return 'bg-blue-600 text-white';
    case 'vendor':
      return 'bg-green-600 text-white';
    case 'designer':
      return 'bg-orange-600 text-white';
    case 'staff':
      return 'bg-teal-600 text-white';
    case 'user':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function TopNav() {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();

  console.group('🎯 TopNav Render');
  console.log('User:', {
    email: user?.email,
    id: user?.id,
    type: user?.type ? {
      name: user.type.name,
      code: user.type.code
    } : 'no type'
  });
  console.groupEnd();

  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">Print Files Manager</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {user && (
          <>
            <span className="text-gray-600">{user.email}</span>
            {user.type ? (
              <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeStyles(user.type.code)}`}>
                {user.type.name}
              </span>
            ) : (
              <span className="text-xs text-gray-500">(no type assigned)</span>
            )}
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}