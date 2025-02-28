import React, { useState, useEffect } from 'react';
import { useJaneStyles } from '../../../hooks/useJaneStyles';
import toast from 'react-hot-toast';

type StyleAndDescriptionProps = {
  styleId: string;
  description: string;
  onStyleIdChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export default function StyleAndDescription({
  styleId,
  description,
  onStyleIdChange,
  onDescriptionChange
}: StyleAndDescriptionProps) {
  const { styles, addStyle } = useJaneStyles();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof styles>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Filter suggestions when styleId changes
  useEffect(() => {
    if (styleId) {
      const filtered = styles.filter(s => 
        s.style_id.toLowerCase().includes(styleId.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1); // Reset selection when input changes
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [styleId, styles]);

  const handleStyleSelect = (style: typeof styles[0]) => {
    onStyleIdChange(style.style_id);
    if (!description) {
      onDescriptionChange(style.description);
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleStyleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleStyleIdBlur = async () => {
    if (!styleId) return;

    // If style doesn't exist, prompt to add it
    const style = styles.find(s => s.style_id === styleId);
    if (!style) {
      const shouldAdd = window.confirm(
        `Style ID "${styleId}" not found. Would you like to add it to the database?`
      );
      
      if (shouldAdd) {
        const success = await addStyle(
          styleId,
          styleId, // Use ID as name initially
          description || '' // Use current description if any
        );
        
        if (success) {
          toast.success('Style added successfully. You can edit its details in Jane Settings.');
        }
      }
    }
  };

  return (
    <>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700">Style ID (just one per export)</label>
        <input
          type="text"
          placeholder="ie: 6030, 3001, 3001cvc"
          value={styleId}
          onChange={(e) => onStyleIdChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleStyleIdBlur}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
            <ul className="max-h-60 overflow-auto rounded-md py-1 text-base">
              {suggestions.map((style, idx) => (
                <li
                  key={style.id}
                  onClick={() => handleStyleSelect(style)}
                  className={`cursor-pointer px-3 py-2 ${
                    idx === selectedIndex 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{style.style_id}</div>
                  <div className="text-sm text-gray-500">{style.name}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder="Copy paste default description here."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
    </>
  );
}