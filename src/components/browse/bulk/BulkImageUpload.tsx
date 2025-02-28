import React, { useState } from 'react';
import { Upload as UploadIcon, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { uploadMockupFile } from '../../../utils/fileUpload';
import type { DesignFile } from '../../../types/database';
import toast from 'react-hot-toast';

type BulkImageUploadProps = {
  selectedDesigns: DesignFile[];
  onUpdate: () => Promise<void>;
};

export default function BulkImageUpload({ selectedDesigns, onUpdate }: BulkImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setProgress({ current: 0, total: selectedDesigns.length });

    try {
      // For each design, upload the same image
      for (let i = 0; i < selectedDesigns.length; i++) {
        const design = selectedDesigns[i];
        setProgress(prev => ({ ...prev, current: i + 1 }));

        try {
          // Create mockup file
          const { url, thumbUrl } = await uploadMockupFile(
            files[0],
            '',
            design.sku,
            design.id,
            { backgroundColor: 'white' }
          );

          // Create mockup record
          const { error: mockupError } = await supabase
            .from('design_mockups')
            .insert({
              design_id: design.id,
              url,
              thumb_url: thumbUrl,
              sort_order: (design.mockups?.length || 0)
            });

          if (mockupError) throw mockupError;
        } catch (error) {
          console.error(`Error processing design ${design.sku}:`, error);
          toast.error(`Failed to process ${design.sku}`);
        }
      }

      await onUpdate();
      toast.success('Images uploaded successfully');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="relative">
      <label className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer">
        <UploadIcon className="w-4 h-4 mr-2" />
        Upload Images
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {uploading && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-10">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>Uploading...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{
                width: `${(progress.current / progress.total) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}