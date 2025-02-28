import React, { useState, useEffect } from 'react';
import type { Category } from '../../types/database';
import CategorySelect from '../upload/CategorySelect';
import KeywordInput from '../upload/KeywordInput';
import MockupUpload from '../upload/MockupUpload';
import { generateKeywordSuggestions } from '../../utils/openai';
import SkuEditor from './SkuEditor';
import toast from 'react-hot-toast';
import { generateKeywordsFromTitle } from '../../utils/keywordGenerator';
import type { DesignFile } from '../../types/database';

type EditDesignFormProps = {
  title: string;
  description: string;
  sku: string;
  design: DesignFile;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onSkuChange: (sku: string) => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onCategoriesUpdate: (categories: Category[]) => void;
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  onMockupsChange: (files: File[]) => void;
};

export default function EditDesignForm({
  title,
  description,
  sku,
  design,
  onTitleChange,
  onDescriptionChange,
  onSkuChange,
  categories,
  selectedCategories,
  onCategoriesChange,
  onCategoriesUpdate,
  keywords,
  onKeywordsChange,
  onMockupsChange,
}: EditDesignFormProps) {
  const [lastProcessedTitle, setLastProcessedTitle] = useState(title);
  const [analyzing, setAnalyzing] = useState(false);


  const handleTitleBlur = () => {
    // Only process if title has changed since last processing
    if (title && title !== lastProcessedTitle) {
      // Normalize the title
      const normalizedTitle = title.replace(/\s+/g, ' ').trim();
      onTitleChange(normalizedTitle);
      
      // Generate keywords from title
      const newKeywords = generateKeywordsFromTitle(title);
      // Merge with existing keywords
      const uniqueNewKeywords = newKeywords.filter(
        keyword => !keywords.includes(keyword)
      );
      if (uniqueNewKeywords.length > 0) {
        onKeywordsChange([...keywords, ...uniqueNewKeywords]);
        toast.success(`Added ${uniqueNewKeywords.length} keywords from title`);
      }
      setLastProcessedTitle(title);
    }
  };

  const handleKeywordsFromCategories = (newKeywords: string[]) => {
    // Merge new keywords with existing ones
    const uniqueKeywords = new Set([...keywords, ...newKeywords]);
    onKeywordsChange(Array.from(uniqueKeywords));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={handleTitleBlur}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <SkuEditor
        sku={sku}
        onAcronymChange={(acronym) => {
          const [id] = sku.split('-');
          onSkuChange(`${id}-${acronym}`);
        }}
      />

      <CategorySelect
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoriesChange={onCategoriesChange}
        onCategoriesUpdate={onCategoriesUpdate}
        onKeywordsFromCategories={handleKeywordsFromCategories}
      />

      <KeywordInput
        keywords={keywords}
        onKeywordsChange={onKeywordsChange}
        onGenerateKeywords={async () => {
          if (!design?.web_file_url) return;
          
          setAnalyzing(true);
          try {
            // Fetch the image file
            const response = await fetch(design.web_file_url);
            const blob = await response.blob();
            const file = new File([blob], `${design.sku}.png`, { type: 'image/png' });

            // Generate keywords only
            const newKeywords = await generateKeywordSuggestions(file);
            if (!newKeywords) throw new Error('Failed to generate keywords');

            // Merge new keywords with existing ones
            const uniqueKeywords = new Set([...keywords, ...newKeywords]);
            onKeywordsChange(Array.from(uniqueKeywords));
            toast.success('Keywords generated successfully');
          } catch (error) {
            console.error('Error getting keyword suggestions:', error);
            toast.error('Failed to generate keywords');
          } finally {
            setAnalyzing(false);
          }
        }}
        analyzing={analyzing}
        design={design}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Mockups
        </label>
        <input
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.svg"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onMockupsChange(files);
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>
    </div>
  );
}