import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import EditMockupOrder from '../components/browse/EditMockupOrder';
import type { DesignFile } from '../types/database';

export default function EditMockupOrderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [designs, setDesigns] = React.useState<DesignFile[]>(
    location.state?.designs || []
  );

  if (!designs?.length) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please select designs to edit from the dashboard.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Edit Mockup Order</h2>
          </div>
          <div className="text-sm text-gray-500">
            {designs.length} designs selected
          </div>
        </div>

        <EditMockupOrder
          designs={designs}
          onDesignUpdate={async () => {
            // Refresh designs from location state to get updated data
            const { data } = await supabase
              .from('design_files')
              .select(`
                *,
                mockups:design_mockups (
                  id,
                  url,
                  thumb_url,
                  is_main,
                  sort_order
                )
              `)
              .in('id', designs.map(d => d.id))
              .order('created_at', { ascending: false });

            if (data) {
              setDesigns(data);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}