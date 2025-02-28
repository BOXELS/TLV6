import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { DesignFilters as Filters } from '../../types/filters';
import { useCategories } from '../../hooks/useCategories'; 

const DEFAULT_FILTERS: Filters = {
  titleSearch: '',
  keywordSearch: '',
  category: '',
  sku: '',
  mockupStatus: 'all'
};

type DesignFiltersProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

const FILTER_OPTIONS = {
  mockupStatus: [
    { value: 'all', label: 'All Mockups' },
    { value: 'with', label: 'Has Mockups' },
    { value: 'without', label: 'No Mockups' }
  ],
  janeStatus: [
    { value: 'all', label: 'All Jane Status' },
    { value: 'yes', label: 'On Jane' },
    { value: 'no', label: 'Not on Jane' }
  ]
};

type TagOption = {
  id: string;
  name: string;
  color: string;
};

export default function DesignFilters({ filters, onChange }: DesignFiltersProps) {
  // Move hooks to the top level
  const { categories, loading, error } = useCategories();
  const [localFilters, setLocalFilters] = React.useState(filters);
  const [showTagDropdown, setShowTagDropdown] = React.useState(false);
  
  const handleReset = React.useCallback(() => {
    onChange(DEFAULT_FILTERS);
  }, [onChange]);
  
  const handleFilterChange = React.useCallback((key: keyof Filters, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  }, [localFilters, onChange]);

  // Sync local filters with prop filters
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  if (loading) {
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white px-4 py-3 rounded-lg shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Mockup Status */}
          <select
            value={localFilters.mockupStatus}
            onChange={(e) => handleFilterChange('mockupStatus', e.target.value)}
            className="w-36 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {FILTER_OPTIONS.mockupStatus.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        
        {/* Jane Status */}
        <select
          value={localFilters.janeStatus}
          onChange={(e) => handleFilterChange('janeStatus', e.target.value)}
          className="w-36 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {FILTER_OPTIONS.janeStatus.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

          {/* Title Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by title"
              value={localFilters.titleSearch}
              onChange={(e) => handleFilterChange('titleSearch', e.target.value)}
              className="pl-8 w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
          </div>

          {/* Keyword Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by keywords"
              value={localFilters.keywordSearch}
              onChange={(e) => handleFilterChange('keywordSearch', e.target.value)}
              className="pl-8 w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
          </div>

          {/* SKU */}
          <input
            type="text"
            placeholder="SKU"
            value={localFilters.sku}
            onChange={(e) => handleFilterChange('sku', e.target.value)}
            className="w-32 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        <button
          onClick={handleReset}
          className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Filters
        </button>
      </div>
    </div>
  );
}