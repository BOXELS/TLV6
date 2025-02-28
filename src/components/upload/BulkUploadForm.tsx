import React from 'react';
import CategorySelect from './CategorySelect';
import KeywordInput from './KeywordInput';
import MockupUpload from './MockupUpload';
import type { Category } from '../../types/database';

type BulkUploadFormProps = {
  backgroundColor: 'white' | 'black';
  onBackgroundColorChange: (color: 'white' | 'black') => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onCategoriesUpdate: (categories: Category[]) => void;
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mockupFiles: File[];
  onMockupsChange: (files: File[]) => void;
  mockupPreviews: string[];
  onRemoveMockup: (index: number) => void;
};

export default function BulkUploadForm({
  backgroundColor,
  onBackgroundColorChange,
  description,
  onDescriptionChange,
  categories,
  selectedCategories,
  onCategoriesChange,
  onCategoriesUpdate,
  keywords,
  onKeywordsChange,
  onFilesSelected,
  mockupFiles,
  onMockupsChange,
  mockupPreviews,
  onRemoveMockup
}: BulkUploadFormProps) {
  const handleKeywordsFromCategories = (newKeywords: string[]) => {
    const uniqueKeywords = new Set([...keywords, ...newKeywords]);
    onKeywordsChange(Array.from(uniqueKeywords));
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Files
        </label>
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          multiple
          onChange={onFilesSelected}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <select
          value={backgroundColor}
          onChange={(e) => onBackgroundColorChange(e.target.value as 'white' | 'black')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="white">White</option>
          <option value="black">Black</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <CategorySelect
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoriesChange={onCategoriesChange}
        onCategoriesUpdate={onCategoriesUpdate}
        onKeywordsFromCategories={handleKeywordsFromCategories}
      />

      <div className="mt-6">
        <KeywordInput
          keywords={keywords}
          onKeywordsChange={onKeywordsChange}
        />
      </div>

      <div className="mt-6">
        <MockupUpload
          onMockupsChange={onMockupsChange}
          mockupPreviews={mockupPreviews}
          onRemoveMockup={onRemoveMockup}
        />
      </div>
    </div>
  );
}