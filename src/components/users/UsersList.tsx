import React from 'react';
import { Edit2, Building2, Palette, Users } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import type { UserWithDetails } from '../../types/users';

type UsersListProps = {
  onEdit: (user: UserWithDetails) => void;
};

export default function UsersList({ onEdit }: UsersListProps) {
  const { users, loading } = useUsers();

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  // Show all users since everyone is admin
  const filteredUsers = users;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 font-medium">{user.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {user.details?.first_name && user.details?.last_name 
                      ? `${user.details.first_name} ${user.details.last_name}`
                      : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">Admin</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleString()
                      : 'Never'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const getRoleBadgeStyles = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-900 text-white';
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'sub_admin':
      return 'bg-blue-100 text-blue-800';
    case 'vendor':
      return 'bg-green-100 text-green-800';
    case 'designer':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'vendor':
      return <Building2 className="w-3 h-3" />;
    case 'designer':
      return <Palette className="w-3 h-3" />;
    case 'staff':
      return <Users className="w-3 h-3" />;
    default:
      return null;
  }
};