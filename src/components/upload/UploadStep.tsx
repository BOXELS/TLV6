import React from 'react';
import PrintFileUpload from './PrintFileUpload';
import RecentDesigns from './RecentDesigns';

type UploadStepProps = {
  onFileSelected: (file: File) => void;
  backgroundColor: 'white' | 'black';
  onBackgroundColorChange: (color: 'white' | 'black') => void;
};

export default function UploadStep({ 
  onFileSelected, 
  backgroundColor,
  onBackgroundColorChange 
}: UploadStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Upload Print File</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Background:</span>
          <select
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value as 'white' | 'black')}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
      </div>
      <PrintFileUpload 
        onFileUploaded={onFileSelected}
        backgroundColor={backgroundColor}
      />

      <RecentDesigns />
    </div>
  );
}