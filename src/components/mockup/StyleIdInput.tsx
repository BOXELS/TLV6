import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type StyleIdInputProps = {
  value: string;
  onChange: (value: string) => void;
  onTitleChange: (title: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
  onStyleSelect?: (style: ClothingStyle) => void;
  onBlur?: () => void;
  required?: boolean;
};

type ClothingStyle = {
  id: string;
  style_id: string;
  title: string;
  keywords: string[];
};

export default function StyleIdInput({ 
  value, 
  onChange, 
  onTitleChange,
  onKeywordsChange,
  onStyleSelect, 
  onBlur, 
  required = false 
}: StyleIdInputProps) {
  const [suggestions, setSuggestions] = useState<ClothingStyle[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStyle, setNewStyle] = useState({
    style_id: '',
    title: '',
    keywords: [] as string[],
    keywordInput: ''
  });

  useEffect(() => {
    if (value.length > 0) {
      searchStyles(value);
    } else {
      setSuggestions([]);
    }
  }, [value]);

  const searchStyles = async (search: string) => {
    try {
      console.log('🔍 Searching styles with query:', search);
      
      // Get full style data including keywords
      const { data, error } = await supabase
        .from('clothing_styles')
        .select('*')
        .ilike('style_id', `%${search}%`)
        .order('style_id')
        .limit(5);

      if (error) throw error;
      
      // Log the full style data including keywords
      console.log('✅ Found styles:', data);
      
      // Ensure each style has a keywords array
      const processedData = data?.map(style => ({
        ...style,
        keywords: Array.isArray(style.keywords) ? style.keywords : []
      })) || [];
      
      setSuggestions(data || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching styles:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex > -1 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      } else if (value && !suggestions.find(s => s.style_id === value)) {
        handleAddNew();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelect = (style: ClothingStyle) => {
    console.log('🎯 Selected style:', style);

    // First update the style ID
    onChange(style.style_id);

    // Batch state updates together
    Promise.resolve().then(() => {
      // Update title if available
      if (style.title && onTitleChange) {
        console.log('📝 Setting title:', style.title);
        onTitleChange(style.title);
      }

      // Update keywords if available
      if (onKeywordsChange && Array.isArray(style.keywords)) {
        console.log('🏷️ Setting keywords:', style.keywords);
        const cleanedKeywords = style.keywords.filter(k => k && k.trim());
        console.log('📦 Cleaned keywords:', cleanedKeywords);
        onKeywordsChange(cleanedKeywords);
      }

      // Call onStyleSelect callback last
      if (onStyleSelect) {
        console.log('📦 Calling onStyleSelect with:', style);
        onStyleSelect(style);
      }
    });

    setShowSuggestions(false);
    if (onBlur) onBlur();
  };

  const handleAddNew = () => {
    setNewStyle({
      ...newStyle,
      style_id: value,
      title: '',
      keywords: [],
      keywordInput: ''
    });
    setShowAddForm(true);
  };

  const handleAddKeyword = () => {
    if (!newStyle.keywordInput.trim()) return;
    if (!newStyle.keywords.includes(newStyle.keywordInput.trim())) {
      setNewStyle({
        ...newStyle,
        keywords: [...newStyle.keywords, newStyle.keywordInput.trim()],
        keywordInput: ''
      });
    }
  };

  const handleSaveStyle = async () => {
    if (!newStyle.style_id || !newStyle.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('💾 Saving new style:', newStyle);
      // Clean and deduplicate keywords
      const cleanedKeywords = [...new Set(
        newStyle.keywords.filter(k => k && k.trim())
      )];
      
      // Create the style record

      const { data, error } = await supabase
        .from('clothing_styles')
        .insert({
          style_id: newStyle.style_id,
          title: newStyle.title,
          keywords: cleanedKeywords
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      console.log('✅ Style saved:', data);
      toast.success('Style added successfully');
      
      // Use handleSelect to ensure consistent behavior
      handleSelect(data);
      
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving style:', error);
      toast.error('Failed to add style');
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value && setShowSuggestions(true)}
        placeholder="Enter style ID..."
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        required={required}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
          <ul className="max-h-60 overflow-auto rounded-md py-1 text-base">
            {suggestions.map((style, index) => (
              <li
                key={style.style_id}
                onClick={() => handleSelect(style)}
                className={`cursor-pointer px-3 py-2 ${
                  index === selectedIndex 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{style.style_id}</div>
                <div className="text-sm text-gray-500">{style.title}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add new style form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Add New Style</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Style ID *
                </label>
                <input
                  type="text"
                  value={newStyle.style_id}
                  onChange={(e) => setNewStyle({ ...newStyle, style_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={newStyle.title}
                  onChange={(e) => setNewStyle({ ...newStyle, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Keywords
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={newStyle.keywordInput}
                    onChange={(e) => setNewStyle({ ...newStyle, keywordInput: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Add keyword"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newStyle.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => setNewStyle({
                          ...newStyle,
                          keywords: newStyle.keywords.filter((_, i) => i !== index)
                        })}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStyle}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Save Style
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}