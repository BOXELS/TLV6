import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';

type VersionHistoryEntry = {
  id: string;
  version: string;
  released_at: string;
  changes: string;
};

export default function VersionHistory() {
  const [entries, setEntries] = useState<VersionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newChanges, setNewChanges] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadVersionHistory();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this version?')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('version_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Version deleted successfully');
      loadVersionHistory();
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Failed to delete version');
    } finally {
      setDeleting(false);
    }
  };

  const loadVersionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('version_history')
        .select('*')
        .order('released_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion || !newChanges) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create version history entry
      const { error: historyError } = await supabase
        .from('version_history')
        .insert({
          version: newVersion,
          changes: newChanges,
          released_by: user.id
        });

      if (historyError) throw historyError;

      // Update VERSION file
      const { error: versionError } = await supabase.storage
        .from('backups')
        .upload('VERSION', newVersion, {
          cacheControl: '0',
          upsert: true
        });

      if (versionError) throw versionError;

      toast.success('Version updated successfully');
      setShowNewForm(false);
      setNewVersion('');
      setNewChanges('');
      loadVersionHistory();
    } catch (error) {
      console.error('Error saving version:', error);
      toast.error('Failed to update version');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading version history...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Version History</h2>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Version
          </button>
        </div>

        {showNewForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">New Version</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Version Number
                </label>
                <input
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="e.g., 1.2.10"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Changes
                </label>
                <textarea
                  value={newChanges}
                  onChange={(e) => setNewChanges(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Describe the changes in this version..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewForm(false);
                    setNewVersion('');
                    setNewChanges('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Version'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <div className="flow-root">
            <ul role="list" className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <li key={entry.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Version {entry.version}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(entry.released_at).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting}
                        className="ml-4 text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-600 whitespace-pre-wrap">{entry.changes.replace(/\\n/g, '\n')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}