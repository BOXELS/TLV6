import React, { useState } from 'react';
import { Eye, Download, FileImage, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { DesignFile } from '../../types/database';
import type { ViewMode } from '../../types/ui';
import { useNavigate } from 'react-router-dom';
import BulkEditToolbar from './BulkEditToolbar';
import JaneListingStatus from './JaneListingStatus';

type DesignListProps = {
  designs: DesignFile[];
  viewMode: ViewMode;
  onDesignUpdate: () => Promise<void>;
  selectedDesigns: DesignFile[];
  onSelectedDesignsChange: (designs: DesignFile[]) => void;
  sortConfig?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  onSort?: (field: string) => void;
};

type SortableColumn = {
  key: string;
  label: string;
};

const SORTABLE_COLUMNS: SortableColumn[] = [
  { key: 'design', label: 'DESIGN' },
  { key: 'main_image', label: 'MAIN IMAGE' },
  { key: 'title', label: 'Title' },
  { key: 'mockups', label: 'MOCKUPS' },
  { key: 'sku', label: 'SKU' },
  { key: 'categories', label: 'CATEGORIES' },
  { key: 'jane_status', label: 'JANE LISTED' },
  { key: 'keywords', label: 'KEYWORDS' },
  { key: 'updated_at', label: 'LAST UPDATED' },
  { key: 'files', label: 'FILES' }
];

export default function DesignList({ 
  designs, 
  viewMode, 
  onDesignUpdate,
  selectedDesigns,
  onSelectedDesignsChange,
  sortConfig,
  onSort
}: DesignListProps) {
  const navigate = useNavigate();

  const handleDesignClick = (design: DesignFile) => {
    navigate(`/design/${design.id}`);
  };

  const handleCheckboxChange = (design: DesignFile, checked: boolean) => {
    onSelectedDesignsChange(
      checked 
        ? [...selectedDesigns, design]
        : selectedDesigns.filter(d => d.id !== design.id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectedDesignsChange(checked ? designs : []);
  };

  const isSelected = (design: DesignFile) => {
    return selectedDesigns.some(d => d.id === design.id);
  };

  const getMainMockupUrl = (design: DesignFile) => {
    const mainMockup = design.mockups?.find(m => m.is_main);
    const firstMockup = design.mockups?.[0];
    
    console.log('Design mockups for', design.sku, {
      allMockups: design.mockups?.map(m => ({
        id: m.id,
        is_main: m.is_main,
        url: m.url,
        thumb_url: m.thumb_url
      })),
      mainMockup: mainMockup ? {
        id: mainMockup.id,
        is_main: mainMockup.is_main,
        url: mainMockup.url,
        thumb_url: mainMockup.thumb_url
      } : null,
      selectedUrl: mainMockup?.thumb_url || firstMockup?.thumb_url
    });
    
    console.log('Design mockups for', design.sku, {
      allMockups: design.mockups?.map(m => ({
        id: m.id,
        is_main: m.is_main,
        url: m.url,
        thumb_url: m.thumb_url
      })),
      mainMockup: mainMockup ? {
        id: mainMockup.id,
        is_main: mainMockup.is_main,
        url: mainMockup.url,
        thumb_url: mainMockup.thumb_url
      } : null,
      selectedUrl: mainMockup?.thumb_url || firstMockup?.thumb_url
    });

    return mainMockup?.thumb_url || firstMockup?.thumb_url;
  };

  if (viewMode === 'card') {
    return (
      <>
        <BulkEditToolbar 
          selectedDesigns={selectedDesigns}
          onUpdate={onDesignUpdate}
          onClearSelection={() => onSelectedDesignsChange([])}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {designs.map((design) => (
            <div key={design.id} className="relative">
              <input
                type="checkbox"
                checked={isSelected(design)}
                onChange={(e) => handleCheckboxChange(design, e.target.checked)}
                className="absolute top-2 left-2 z-10"
              />
              <div 
                className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-50">
                  <img
                    src={design.web_file_url}
                    alt={design.title}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">{design.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{design.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                  <div className="mt-2 flex flex-wrap gap-1">
                    {design.categories?.map((cat) => (
                      <span
                        key={`${design.id}-${cat.category_id}`}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                   <JaneListingStatus designId={design.id} onUpdate={onDesignUpdate} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <BulkEditToolbar 
        selectedDesigns={selectedDesigns}
        onUpdate={onDesignUpdate}
        onClearSelection={() => onSelectedDesignsChange([])}
      />
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedDesigns.length === designs.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              {SORTABLE_COLUMNS.map((column, index) => (
                <th
                  key={column.key}
                  onClick={() => onSort?.(column.key)}
                  className={`px-3 py-3 ${index === 3 ? 'text-center' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50`}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortConfig?.field === column.key ? (
                      sortConfig.direction === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {designs.map((design) => (
              <tr key={design.id}>
                <td className="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={isSelected(design)}
                    onChange={(e) => handleCheckboxChange(design, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div 
                    className="aspect-square w-16 h-16 bg-gray-50 rounded cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => handleDesignClick(design)}
                  >
                    <img
                      src={design.web_file_url} 
                      alt={design.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="aspect-square w-16 h-16 bg-gray-50 rounded relative">
                    {design.mockups?.length ? (
                      <img
                        src={getMainMockupUrl(design)}
                        alt={`${design.title} thumbnail`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                        No Mockups
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div 
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600"
                    onClick={() => handleDesignClick(design)}
                  >
                    {design.title}
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  <span className={`font-bold ${
                    design.mockups?.length === 0 
                      ? 'text-red-700 bg-red-100 px-2 py-1 rounded' 
                      : design.mockups?.length <= 3
                        ? 'text-red-600 bg-red-50 px-2 py-1 rounded'
                        : 'text-gray-900'
                  }`}>
                    {design.mockups?.length || 0}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm text-gray-500">
                    {design.sku}
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="flex flex-wrap gap-1">
                    {design.categories?.map((cat) => (
                      <span
                        key={`${design.id}-${cat.category_id}`}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  <JaneListingStatus designId={design.id} onUpdate={onDesignUpdate} />
                </td>
                <td className="px-3 py-4 text-center">
                  <span className="text-sm text-gray-900">
                    {design.keywords?.length || 0}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(design.updated_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <a
                      href={design.web_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Preview"
                    >
                      <Eye className="h-5 w-5" />
                    </a>
                    <a
                      href={design.print_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Print File"
                    >
                      <FileImage className="h-5 w-5" />
                    </a>
                    <a
                      href={design.print_file_url}
                      download
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Download Full Resolution"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}