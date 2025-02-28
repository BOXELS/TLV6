import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../types/database';
import toast from 'react-hot-toast';

type CategorySelectProps = {
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onCategoriesUpdate: (categories: Category[]) => void;
  onKeywordsFromCategories?: (keywords: string[]) => void;
  disabled?: boolean;
};

export default function CategorySelect({
  categories,
  selectedCategories,
  onCategoriesChange,
  onCategoriesUpdate,
  onKeywordsFromCategories,
  disabled = false
}: CategorySelectProps) {
  const [input, setInput] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (input) {
      const filtered = categories.filter(cat => 
        cat.name.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredCategories(filtered);
      setSelectedIndex(-1);
    } else {
      setFilteredCategories([]);
    }
  }, [input, categories]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          category_keyword_links(
            keywords(keyword)
          )
        `)
        .order('name');

      if (error) throw error;
      onCategoriesUpdate(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) return;

    // Add category
    const newSelectedCategories = [...selectedCategories, categoryId];
    onCategoriesChange(newSelectedCategories);

    // Get keywords for selected categories
    if (onKeywordsFromCategories) {
      const selectedCategory = categories.find(c => c.id === categoryId);
      const keywords = selectedCategory?.category_keyword_links
        ?.map(link => link.keywords?.keyword)
        .filter(Boolean) || [];
      
      if (keywords.length > 0) {
        onKeywordsFromCategories(keywords);
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!input.trim()) return;

      // If an item is selected in the dropdown, use that
      if (selectedIndex >= 0 && selectedIndex < filteredCategories.length) {
        const selectedCategory = filteredCategories[selectedIndex];
        handleCategorySelect(selectedCategory.id);
        setInput('');
        return;
      }

      const exists = categories.find(
        cat => cat.name.toLowerCase() === input.trim().toLowerCase()
      );

      if (exists) {
        handleCategorySelect(exists.id);
        setInput('');
        return;
      }

      if (showConfirmation) {
        // Add new category
        try {
          const { data, error } = await supabase
            .from('categories')
            .insert([{ name: input.trim() }])
            .select()
            .single();

          if (error) throw error;

          onCategoriesUpdate([...categories, data]);
          handleCategorySelect(data.id);
          toast.success('Category added successfully');
        } catch (error) {
          toast.error('Failed to add category');
        }
        
        setInput('');
        setShowConfirmation(false);
      } else {
        setShowConfirmation(true);
      }
    } else if (e.key === 'Escape') {
      setShowConfirmation(false);
      setInput('');
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredCategories.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Categories *
      </label>
      <div className="mt-1 space-y-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowConfirmation(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type to search or add new category"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={disabled}
        />
        
        {showConfirmation && (
          <div className="text-sm text-gray-600">
            Press Enter again to add "{input}" as a new category
          </div>
        )}

        {filteredCategories.length > 0 && !showConfirmation && (
          <ul className="max-h-32 overflow-auto rounded-md border border-gray-200 bg-white shadow-sm">
            {filteredCategories.map((category) => (
              <li
                key={category.id}
                className={`px-3 py-2 cursor-pointer ${
                  filteredCategories.indexOf(category) === selectedIndex 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  handleCategorySelect(category.id);
                  setInput('');
                }}
              >
                {category.name}
              </li>
            ))}
          </ul>
        )}

        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCategories.map((id) => {
              const category = categories.find(c => c.id === id);
              return category ? (
                <span
                  key={id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {category.name}
                  <button
                    type="button"
                    onClick={() => onCategoriesChange(selectedCategories.filter(c => c !== id))}
                    className="ml-1 inline-flex items-center p-0.5 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}