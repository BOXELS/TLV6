import React, { useState, useEffect } from 'react';
import { Download, History, RefreshCw, FolderDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type BackupFile = {
  name: string;
  created_at: string;
  size: number;
  url: string;
};

type StorageObject = {
  name: string;
  bucket_id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
};

type StorageBackup = {
  objects: StorageObject[];
  metadata: {
    timestamp: string;
    version: string;
    user: string;
  };
};

export default function StorageBackup() {
  const [downloading, setDownloading] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingFiles, setProcessingFiles] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .list('storage', {
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
            .getPublicUrl(`storage/${file.name}`);

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
    const toastId = toast.loading('Creating storage backup...');

    try {
      // Call RPC function to create backup
      const { data, error } = await supabase.rpc('create_storage_backup');
      
      if (error) throw error;
      if (!data?.data) throw new Error('No backup data returned');

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(
          `storage/${data.filename}`,
          new Blob([JSON.stringify(data.data)], { type: 'application/json' }),
          { upsert: true }
        );

      if (uploadError) throw uploadError;

      // Get download URL
      const { data: { signedUrl }, error: signedError } = await supabase.storage
        .from('backups')
        .createSignedUrl(`storage/${data.filename}`, 60);

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

      toast.success('Storage backup created and downloaded successfully', { id: toastId });
      await loadBackups(); // Refresh backup list
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to create storage backup', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadFiles = async (backup: BackupFile) => {
    try {
      setProcessingFiles(true);
      abortControllerRef.current = new AbortController();
      const toastId = toast.loading('Processing storage backup...');

      // Get signed URL for the backup file
      const { data: { signedUrl }, error: signedError } = await supabase.storage
        .from('backups')
        .createSignedUrl(`storage/${backup.name}`, 60);
      
      if (signedError) throw signedError;

      // Download and parse the backup file
      const response = await fetch(signedUrl, {
        signal: abortControllerRef.current.signal
      });
      if (!response.ok) throw new Error('Failed to download backup file');
      
      const backupData = await response.json() as StorageBackup;
      
      // Create a folder for this backup
      const folderName = backup.name.replace('.json', '');
      
      // Process each file
      let successCount = 0;
      let failureCount = 0;
      
      // Early return if already aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Download cancelled');
      }

      for (const file of backupData.objects) {        
        try {
          // Check if cancelled
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Download cancelled');
          }

          // Get signed URL for the original file
          const { data: { signedUrl: fileUrl }, error: fileError } = await supabase.storage
            .from('designs')
            .createSignedUrl(file.name, 60);
          
          if (fileError) throw fileError;

          // Download the file
          const fileResponse = await fetch(fileUrl, {
            signal: abortControllerRef.current.signal
          });
          if (!fileResponse.ok) throw new Error(`Failed to download ${file.name}`);
          
          // Create download link
          const a = document.createElement('a');
          a.href = fileUrl;
          a.download = file.name.split('/').pop() || file.name;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Add delay to prevent overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
          
          successCount++;
        } catch (error) {
          console.error(`Failed to download ${file.name}:`, error);
          if (error instanceof Error && error.message === 'Download cancelled') {
            throw error;
          }
          failureCount++;
        }
      }

      if (!abortControllerRef.current?.signal.aborted) {
        toast.success(
          `Downloaded ${successCount} files${failureCount > 0 ? `, ${failureCount} failed` : ''}`, 
          { id: toastId }
        );
      }
    } catch (error) {
      console.error('Error processing backup:', error);
      if (error instanceof Error && error.message === 'Download cancelled') {
        toast.success('Download cancelled');
      } else {
        toast.error('Failed to process backup');
      }
    } finally {
      abortControllerRef.current = null;
      setProcessingFiles(false);
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setProcessingFiles(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Storage Backup</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create and download a backup of your storage files
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
                <div className="flex items-center gap-2">
                  <a
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        // Get signed URL for download
                        const { data: { signedUrl }, error } = await supabase.storage
                          .from('backups')
                          .createSignedUrl(`storage/${backup.name}`, 60);
                        
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
                    Download JSON
                  </a>
                  <button
                    onClick={() => processingFiles ? handleCancelDownload() : handleDownloadFiles(backup)}
                    disabled={processingFiles}
                    className="flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                  >
                    {processingFiles ? (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Cancel Download
                      </>
                    ) : (
                      <>
                        <FolderDown className="w-4 h-4 mr-1" />
                        Download Files
                      </>
                    )}
                  </button>
                </div>
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