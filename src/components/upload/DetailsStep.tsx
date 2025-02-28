import React, { useEffect, useState } from 'react';
import CategorySelect from './CategorySelect';
import KeywordInput from './KeywordInput';
import SkuGenerator from './SkuGenerator';
import MockupUpload from './MockupUpload';
import { useNextSkuId } from '../../hooks/useNextSkuId';
import type { Category } from '../../types/database';
import { generateKeywordsFromTitle } from '../../utils/keywordGenerator';

type DetailsStepProps = {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onCategoriesUpdate: (categories: Category[]) => void;
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  skuId: string;
  skuAcronym: string;
  onSkuIdChange: (id: string) => void;
  onSkuAcronymChange: (acronym: string) => void;
  mockupFiles: File[];
  onMockupsChange: (files: File[]) => void;
  mockupPreviews: string[];
  onRemoveMockup: (index: number) => void;
  readOnlySku?: boolean;
};

export default function DetailsStep(props: DetailsStepProps) {
  const { nextId, loading: loadingNextId } = useNextSkuId();
  const [lastProcessedTitle, setLastProcessedTitle] = useState('');

  useEffect(() => {
    if (nextId && !props.skuId) {
      props.onSkuIdChange(nextId);
    }
  }, [nextId, props.skuId]);

  const handleTitleBlur = () => {
    // Only process if title has changed since last processing
    if (props.title && props.title !== lastProcessedTitle) {
      const newKeywords = generateKeywordsFromTitle(props.title);
      // Only add new keywords that don't already exist
      const uniqueNewKeywords = newKeywords.filter(
        keyword => !props.keywords.includes(keyword)
      );
      if (uniqueNewKeywords.length > 0) {
        props.onKeywordsChange([...props.keywords, ...uniqueNewKeywords]);
      }
      setLastProcessedTitle(props.title);
    }
  };
  const handleKeywordsFromCategories = (newKeywords: string[]) => {
    // Merge new keywords with existing ones
    const uniqueKeywords = new Set([...props.keywords, ...newKeywords]);
    props.onKeywordsChange(Array.from(uniqueKeywords));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          type="text"
          value={props.title}
          onChange={(e) => props.onTitleChange(e.target.value)}
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
          value={props.description}
          onChange={(e) => props.onDescriptionChange(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <SkuGenerator
        skuId={props.skuId}
        skuAcronym={props.skuAcronym}
        onSkuIdChange={props.onSkuIdChange}
        onSkuAcronymChange={props.onSkuAcronymChange}
        readOnly={props.readOnlySku}
        loading={loadingNextId}
      />

      <CategorySelect
        categories={props.categories}
        selectedCategories={props.selectedCategories}
        onCategoriesChange={props.onCategoriesChange}
        onCategoriesUpdate={props.onCategoriesUpdate}
        onKeywordsFromCategories={handleKeywordsFromCategories}
      />

      <KeywordInput
        keywords={props.keywords}
        onKeywordsChange={props.onKeywordsChange}
      />

      <MockupUpload
        onMockupsChange={props.onMockupsChange}
        mockupPreviews={props.mockupPreviews}
        onRemoveMockup={props.onRemoveMockup}
      />
    </div>
  );
}