import React, { useState } from 'react';
import { Upload as UploadIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';

type MockupUploadProps = {
  onMockupsChange: (files: File[]) => void;
  mockupPreviews: string[];
  onRemoveMockup: (index: number) => void;
};

export default function MockupUpload({ 
  onMockupsChange,
  mockupPreviews,
  onRemoveMockup
}: MockupUploadProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onMockupsChange(validFiles);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Mockup Images
        </label>
        <span className="text-xs text-gray-500">
          Upload product mockups (PNG, JPG, SVG)
        </span>
      </div>

      {/* Mockup previews grid */}
      {mockupPreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {mockupPreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
              <img 
                src={preview.thumb || preview}
                alt={`Mockup ${index + 1}`}
                className="w-full aspect-square object-contain border rounded-lg bg-white"
              />
              <button
                type="button"
                onClick={() => onRemoveMockup(index)}
                className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload input */}
      <div className="flex items-center justify-center w-full">
        <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
          <UploadIcon className="w-8 h-8 mb-2" />
          <span className="text-sm">Click to upload mockup images</span>
          <input
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}