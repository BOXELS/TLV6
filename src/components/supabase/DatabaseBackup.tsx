import React, { useState, useEffect } from 'react';
import { Download, History, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type BackupFile = {
  name: string;
  created_at: string;
  size: number;
  url: string;
};

export default function DatabaseBackup() {
  const [downloading, setDownloading] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .list('database', {
          sortBy: { column: 'created_at', order: 'desc' },
          limit: 10
        });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setBackups([]);
        return;
      }

      const backupFiles = await Promise.all(
        (data || []).map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('backups')
            .getPublicUrl(`database/${file.name}`);

          return {
            name: file.name,
            created_at: file.created_at,
            size: file.metadata?.size || 0,
            url: publicUrl
          };
        })
      );

      setBackups(backupFiles);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Failed to load backup history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setDownloading(true);
    const toastId = toast.loading('Creating database backup...');

    try {
      // Call RPC function to create backup
      const { data, error } = await supabase.rpc('create_database_backup');
      
      if (error) throw error;
      if (!data?.data) throw new Error('No backup data returned');

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(
          `database/${data.filename}`,
          new Blob([JSON.stringify(data.data)], { type: 'application/json' }),
          { upsert: true }
        );

      if (uploadError) throw uploadError;

      // Get download URL
      const { data: { signedUrl }, error: signedError } = await supabase.storage
        .from('backups')
        .createSignedUrl(`database/${data.filename}`, 60);

      if (signedError) throw signedError; 

      // Create download link
      const a = document.createElement('a');
      a.href = signedUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Database backup created and downloaded successfully', { id: toastId });
      await loadBackups(); // Refresh backup list
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to create database backup', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Database Backup</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create and download a backup of your database content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBackups}
            className="p-2 text-gray-400 hover:text-gray-500"
            title="Refresh backup list"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={downloading}
            className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Creating Backup...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Recent Backups */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Recent Backups</h3>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading backups...</p>
        ) : backups.length > 0 ? (
          <div className="border rounded-lg divide-y">
            {backups.map((backup) => (
              <div key={backup.name} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">{backup.name}</p>
                  <p className="text-sm text-gray-500">
                    Created on {new Date(backup.created_at).toLocaleString()}
                  </p>
                </div>
                <a
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      // Get signed URL for download
                      const { data: { signedUrl }, error } = await supabase.storage
                        .from('backups')
                        .createSignedUrl(`database/${backup.name}`, 60);
                      
                      if (error) throw error;
                      
                      // Open in new window
                      window.open(signedUrl, '_blank');
                    } catch (error) {
                      console.error('Error getting signed URL:', error);
                      toast.error('Failed to download backup');
                    }
                  }}
                  href="#"
                  className="flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No backups found</p>
        )}
      </div>
    </div>
  );
}