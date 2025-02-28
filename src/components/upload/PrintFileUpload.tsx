import React, { useState } from 'react';
import { Upload as UploadIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';

type PrintFileUploadProps = {
  onFileUploaded: (file: File) => void;
  backgroundColor?: 'white' | 'black';
};

export default function PrintFileUpload({ 
  onFileUploaded,
  backgroundColor = 'white'
}: PrintFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // Clear input to allow re-uploading same file

    // Check file extension and type
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.png', '.svg'];
    
    if (!validExtensions.includes(extension) || 
        (extension === '.png' && file.type !== 'image/png') ||
        (extension === '.svg' && !['image/svg+xml', 'application/svg+xml'].includes(file.type))) {
      toast.error('Please upload a valid PNG or SVG file');
      return;
    }

    // For SVG files, validate content
    if (extension === '.svg') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content.toLowerCase().includes('<svg')) {
          setSelectedFile(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          onFileUploaded(file);
        } else {
          toast.error('Invalid SVG file - missing SVG content');
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read SVG file');
      };
      reader.readAsText(file);
      return;
    }

    // Handle PNG files directly
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileUploaded(file);
  };

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileUploaded(null);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative">
        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Preview"
              className={`w-full aspect-square object-contain border rounded-lg ${
                backgroundColor === 'black' ? 'bg-black' : 'bg-white'
              }`}
            />
            <button
              type="button"
              onClick={clearSelection}
              className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 hover:bg-red-200"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        ) : (
          <div className={`w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${
            backgroundColor === 'black' ? 'bg-black' : 'bg-gray-50'
          }`}>
            <div className="text-center">
              <UploadIcon className={`mx-auto h-12 w-12 ${
                backgroundColor === 'black' ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={`mt-2 text-sm ${
                backgroundColor === 'black' ? 'text-gray-400' : 'text-gray-500'
              }`}>No file selected</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload controls */}
      <input
        type="file"
        accept=".png,.svg"
        onChange={handleFileSelect}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
      />
    </div>
  );
}