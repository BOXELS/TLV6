import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type KeywordInputProps = {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  analyzing?: boolean;
  disabled?: boolean;
};

export default function KeywordInput({ 
  keywords, 
  onKeywordsChange, 
  analyzing = false,
  disabled = false 
}: KeywordInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; keyword: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim()) {
      searchKeywords(input);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input]);

  const searchKeywords = async (search: string) => {
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('id, keyword')
        .ilike('keyword', `%${search}%`)
        .order('keyword')
        .limit(5);

      if (error) throw error;

      // Filter out already selected keywords
      const filteredSuggestions = (data || []).filter(
        suggestion => !keywords.includes(suggestion.keyword)
      );

      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching keywords:', error);
    }
  };

  const addKeyword = async (keyword: string) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    
    // Check if keyword already exists in the list
    if (keywords.some(k => k.toLowerCase() === normalizedKeyword)) {
      toast.error('This keyword has already been added');
      setInput('');
      return;
    }

    try {
      // Check if keyword exists in database
      const { data: existing } = await supabase
        .from('keywords')
        .select('keyword')
        .ilike('keyword', normalizedKeyword)
        .limit(1);

      // If it exists, use the exact case from the database
      if (existing && existing.length > 0) {
        onKeywordsChange([...keywords, existing[0].keyword]);
      } else {
        // If it's new, use the original case the user entered
        onKeywordsChange([...keywords, keyword.trim()]);
      }

      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast.error('Failed to add keyword');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        addKeyword(suggestions[selectedIndex].keyword);
      } else if (input.trim()) {
        addKeyword(input.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Default Keywords
      </label>
      <div className="mt-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim() && setShowSuggestions(true)}
          placeholder="Type to search or add new keywords"
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            analyzing ? 'bg-gray-50' : ''
          }`}
          disabled={disabled || analyzing}
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                  index === selectedIndex ? 'bg-indigo-600 text-white' : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => addKeyword(suggestion.keyword)}
              >
                {suggestion.keyword}
              </li>
            ))}
          </ul>
        )}
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
              onClick={() => onKeywordsChange(keywords.filter(k => k !== keyword))}
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