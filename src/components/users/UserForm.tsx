import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import type { UserWithDetails } from '../../types/users';
import toast from 'react-hot-toast';

type UserFormProps = {
  user: UserWithDetails;
  onClose: () => void;
};

export default function UserForm({ user, onClose }: UserFormProps) {
  const { updateUserDetails } = useUsers();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState({
    email: user.email ?? '',
    first_name: user.details?.first_name || '',
    last_name: user.details?.last_name || '',
    address_line1: user.details?.address_line1 || '',
    address_line2: user.details?.address_line2 || '',
    city: user.details?.city || '',
    state: user.details?.state || '',
    zip: user.details?.zip || '',
    phone: user.details?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update details
      const success = await updateUserDetails(user.id, details);
      if (!success) throw new Error('Failed to update details');

      toast.success('User updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="text"
              value={user.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={details.first_name}
                onChange={(e) => setDetails({ ...details, first_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={details.last_name}
                onChange={(e) => setDetails({ ...details, last_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
            <input
              type="text"
              value={details.address_line1}
              onChange={(e) => setDetails({ ...details, address_line1: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
            <input
              type="text"
              value={details.address_line2}
              onChange={(e) => setDetails({ ...details, address_line2: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={details.city}
                onChange={(e) => setDetails({ ...details, city: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                value={details.state}
                onChange={(e) => setDetails({ ...details, state: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP</label>
              <input
                type="text"
                value={details.zip}
                onChange={(e) => setDetails({ ...details, zip: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}