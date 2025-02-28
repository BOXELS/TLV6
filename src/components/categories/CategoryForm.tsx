import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import KeywordInput from './KeywordInput';
import { generateCategoryKeywords } from '../../utils/openai'; 
import { Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

type CategoryFormProps = {
  categoryId?: string;
  initialName?: string;
  initialKeywords?: string[];
  onSave: () => void;
  onCancel: () => void;
};

export default function CategoryForm({ 
  categoryId,
  initialName = '', 
  initialKeywords = [], 
  onSave, 
  onCancel 
}: CategoryFormProps) {
  const [name, setName] = useState(initialName);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setLoading(true);
    try {
      // Create or update category
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .upsert([{ 
          ...(categoryId ? { id: categoryId } : {}),
          name: name.trim() 
        }])
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Remove existing keyword links if updating
      if (categoryId) {
        const { error: deleteError } = await supabase
          .from('category_keyword_links')
          .delete()
          .eq('category_id', categoryId);

        if (deleteError) throw deleteError;
      }

      // Handle keywords
      if (keywords.length > 0) {
        // First, ensure all keywords exist in the keywords table
        for (const keyword of keywords) {
          const { data: existing } = await supabase
            .from('keywords')
            .select('id')
            .eq('keyword', keyword)
            .maybeSingle();

          if (!existing) {
            // Create new keyword if it doesn't exist
            const { error: newKeywordError } = await supabase
              .from('keywords')
              .insert([{ keyword }]);

            if (newKeywordError) {
              console.error('Error creating keyword:', newKeywordError);
              continue; // Skip this keyword if there's an error
            }
          }
        }

        // Now get all keyword IDs (they should all exist now)
        const { data: keywordRecords, error: keywordsError } = await supabase
          .from('keywords')
          .select('id, keyword')
          .in('keyword', keywords);

        if (keywordsError) throw keywordsError;

        if (keywordRecords && keywordRecords.length > 0) {
          // Create category-keyword links
          const { error: linksError } = await supabase
            .from('category_keyword_links')
            .insert(
              keywordRecords.map(kr => ({
                category_id: category.id,
                keyword_id: kr.id
              }))
            );

          if (linksError) throw linksError;
        }
      }

      onSave();
      toast.success(`Category ${initialName ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKeywords = async () => {
    if (!name.trim()) {
      toast.error('Please enter a category name first');
      return;
    }

    setAnalyzing(true);
    try {
      const newKeywords = await generateCategoryKeywords(name);
      if (!newKeywords) throw new Error('Failed to generate keywords');

      // Merge with existing keywords
      // Filter out keywords that already exist
      const uniqueNewKeywords = newKeywords.filter(
        keyword => !keywords.includes(keyword)
      );
      
      // Only update if we have new keywords to add
      if (uniqueNewKeywords.length > 0) {
        const uniqueKeywords = [...keywords, ...uniqueNewKeywords];
        setKeywords(uniqueKeywords);
        toast.success(`Added ${uniqueNewKeywords.length} new keywords`);
      } else {
        toast.info('No new keywords to add');
      }
    } catch (error) {
      console.error('Error generating keywords:', error);
      toast.error('Failed to generate keywords');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={loading}
        />
      </div>
      
      <div className="flex justify-end">
        <div className="flex gap-2">
          {keywords.length > 0 && (
            <button
              type="button"
              onClick={() => setKeywords([])}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Delete Keywords
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerateKeywords}
            disabled={analyzing || loading || !name.trim()}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Keywords
              </>
            )}
          </button>
        </div>
      </div>

      <KeywordInput
        keywords={keywords}
        onKeywordsChange={setKeywords}
        disabled={loading}
        analyzing={analyzing}
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Category'}
        </button>
      </div>
    </form>
  );
}