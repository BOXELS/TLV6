import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { fetchShipstationTags } from '../utils/shipstationApi';
import type { ShipstationCredentials, ShipstationTag } from '../types/shipstation';
import toast from 'react-hot-toast';

export default function ShipstationTags() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tags, setTags] = useState<ShipstationTag[]>([]);
  const [credentials, setCredentials] = useState<ShipstationCredentials | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('integration_credentials')
        .select('credentials')
        .eq('service', 'shipstation')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCredentials(data.credentials);
        loadTags(data.credentials);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setLoading(false);
    }
  };

  const loadTags = async (creds: ShipstationCredentials) => {
    try {
      // Load tags from local database
      const { data: localTags, error } = await supabase
        .from('shipstation_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(localTags.map(tag => ({
        tagId: tag.tag_id,
        name: tag.name,
        color: tag.color
      })));
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load Shipstation tags');
    } finally {
      setLoading(false);
    }
  };

 const handleSyncTags = async () => {
  if (!credentials) return;

  if (syncing) {
    toast.error('Sync already in progress');
    return;
  }

  setSyncing(true);
  const toastId = toast.loading('Syncing tags...');

  try {
    // Fetch latest tags from Shipstation
    const tags = await fetchShipstationTags(credentials);

    // Process each tag individually to avoid conflicts
    for (const tag of tags) {
      try {
        // Try to update the tag first
        const { error: updateError } = await supabase
          .from('shipstation_tags')
          .update({
            name: tag.name,
            color: tag.color
          })
          .eq('tag_id', tag.tagId);

        // If the update fails, try inserting the tag
        if (updateError) {
          const { error: insertError } = await supabase
            .from('shipstation_tags')
            .insert([{
              tag_id: tag.tagId,
              name: tag.name,
              color: tag.color
            }]);

          if (insertError) {
            console.error(`Error inserting tag ${tag.name}:`, insertError);
          }
        }
      } catch (error) {
        console.error(`Error processing tag ${tag.name}:`, error);
      } finally {
        // Optional: Add any cleanup code here if necessary
      }
    }

    // Reload tags from database
    await loadTags(credentials);
    toast.success('Tags synchronized successfully', { id: toastId });

  } catch (error) {
    console.error('Error syncing tags:', error);
    toast.error('Failed to sync tags. Please try again.', { id: toastId });
  } finally {
    setSyncing(false);
  }
};



  if (!credentials) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          Please connect your Shipstation account first.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Tag className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Shipstation Tags</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncTags}
              disabled={syncing}
              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Tags'}
            </button>
            <button
              onClick={() => toast.error('Tag creation via API not supported by Shipstation')}
              className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Tag
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading tags...</div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tags.map((tag) => (
                    <tr key={tag.tagId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm text-gray-900">{tag.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{tag.color}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => toast.error('Tag editing via API not supported by Shipstation')}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toast.error('Tag deletion via API not supported by Shipstation')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}