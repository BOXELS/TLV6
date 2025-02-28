import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import MockupGeneratorV2 from '../components/browse/MockupGeneratorV2';
import type { DesignFile } from '../types/database';
import toast from 'react-hot-toast';

export default function MockupGeneratorV2Page() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState<DesignFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDesign();
  }, [id]);

  const loadDesign = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
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
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Design not found');
        navigate('/dashboard');
        return;
      }

      setDesign(data);
    } catch (error) {
      console.error('Error loading design:', error);
      toast.error('Failed to load design');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleMockupsGenerated = async (mockupFiles: File[]) => {
    if (!design) return;

    try {
      for (const mockupFile of mockupFiles) {
        // Upload mockup file
        const fileExt = mockupFile.name.substring(mockupFile.name.lastIndexOf('.'));
        const filePath = `mockups/${design.sku}-mockup-${Date.now()}${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('designs')
          .upload(filePath, mockupFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl: url } } = supabase.storage
          .from('designs')
          .getPublicUrl(filePath);

        // Create mockup record
        const { error: mockupError } = await supabase
          .from('design_mockups')
          .insert({
            design_id: design.id,
            url,
            thumb_url: url, // Use same URL for thumbnail initially
            sort_order: (design.mockups?.length || 0)
          });

        if (mockupError) throw mockupError;
      }

      toast.success('Mockups saved successfully');
      await loadDesign(); // Refresh design data
    } catch (error) {
      console.error('Error saving mockups:', error);
      toast.error('Failed to save mockups');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading design...</div>
      </DashboardLayout>
    );
  }

  if (!design) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Design not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            Generate Mockup for {design.sku}
          </h2>
        </div>

        <MockupGeneratorV2 
          design={design}
          onMockupsGenerated={handleMockupsGenerated}
        />
      </div>
    </DashboardLayout>
  );
}