import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';

type KeywordInputProps = {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  onGenerateKeywords?: () => Promise<void>;
  analyzing?: boolean;
  design?: DesignFile;
  disabled?: boolean;
};

export default function KeywordInput({ 
  keywords, 
  onKeywordsChange, 
  onGenerateKeywords,
  analyzing = false,
  design,
  disabled = false 
}: KeywordInputProps) {
  const [newKeyword, setNewKeyword] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      if (!keywords.includes(newKeyword.trim())) {
        onKeywordsChange([...keywords, newKeyword.trim()]);
      }
      setNewKeyword('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    onKeywordsChange(keywords.filter(k => k !== keywordToRemove));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        <div className="flex justify-between items-center">
          <span>Keywords</span>
          <div className="flex items-center gap-2">
            {keywords.length > 0 && (
              <button
                onClick={() => onKeywordsChange([])}
                disabled={disabled}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-900 bg-white border border-red-300 rounded-md hover:bg-red-50 flex items-center gap-2"
              >
                <X className="w-3 h-3" />
                Delete All
              </button>
            )}
            {onGenerateKeywords && design && (
            <button
              onClick={onGenerateKeywords}
              disabled={analyzing || disabled}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Tag className="w-3 h-3" />
                  AI Keywords
                </>
              )}
            </button>
            )}
          </div>
        </div>
      </label>
      <div className="mt-1">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter to add"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={disabled}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            {keyword}
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              className="ml-1 inline-flex items-center p-0.5 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}