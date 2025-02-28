import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import UsersList from '../components/users/UsersList';
import UserForm from '../components/users/UserForm';
import AddUserForm from '../components/users/AddUserForm';
import type { UserWithDetails } from '../types/users';

export default function Users() {
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Users Management</h2>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>

        <UsersList onEdit={setEditingUser} />

        {editingUser && (
          <UserForm
            user={editingUser}
            onClose={() => setEditingUser(null)}
          />
        )}

        {showAddUser && (
          <AddUserForm
            onClose={() => setShowAddUser(false)}
            onSuccess={() => window.location.reload()}
          />
        )}
      </div>
    </DashboardLayout>
  );
}