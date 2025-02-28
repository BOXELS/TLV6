import React, { useState } from 'react';
import { Download as DownloadIcon, History } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';
import { createBackup } from '../utils/backup';
import { supabase } from '../lib/supabase';

type BackupFile = {
  name: string;
  created_at: string;
  size: number;
  url: string;
};

export default function Download() {
  const [downloading, setDownloading] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .list('', {
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
            .getPublicUrl(file.name);

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
      toast.error('Failed to load backup history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setDownloading(true);
    const toastId = toast.loading('Creating backup...');
    try {
      const { url, filename } = await createBackup();
      
      if (!url) {
        throw new Error('Failed to get download URL');
      }
      
      // Create download link
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast.success('Backup created and downloaded successfully', { id: toastId });
        await loadBackups(); // Refresh backup list
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        throw new Error('Failed to download backup file');
      }

    } catch (error) {
      console.error('Backup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create backup', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <DownloadIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Database Backup</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Create and download a backup of your database content. Each backup includes:
          </p>

          <ul className="list-disc list-inside mb-6 text-gray-600 space-y-2">
            <li>Design files metadata</li>
            <li>Categories and keywords</li>
            <li>Database relationships and links</li>
            <li>Project source code and configuration</li>
            <li>Scripts and utilities</li>
          </ul>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Backups are automatically stored in Supabase storage and can be downloaded at any time.
                  Please keep this window open until the backup completes.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateBackup}
            disabled={downloading}
            className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {downloading ? 'Creating Backup...' : 'Create New Backup'}
          </button>

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
                      href={backup.url}
                      download
                      className="flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <DownloadIcon className="w-4 h-4 mr-1" />
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
      </div>
    </DashboardLayout>
  );
}