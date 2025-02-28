import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DesignFilters from '../components/browse/DesignFilters';
import DesignList from '../components/browse/DesignList';
import ViewToggle from '../components/browse/ViewToggle';
import DesignStats from '../components/browse/DesignStats';
import CsvExportButton from '../components/browse/CsvExportButton';
import JaneCsvExportButton from '../components/browse/JaneCsvExportButton';
import Pagination from '../components/browse/Pagination';
import { useDesigns } from '../hooks/useDesigns';
import type { ViewMode } from '../types/ui';
import type { DesignFile } from '../types/database';

type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
};

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedDesigns, setSelectedDesigns] = useState<DesignFile[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'updated_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const {
    designs,
    totalCount,
    loading,
    filters,
    setFilters,
    loadDesigns,
    currentPage: dbPage,
    setCurrentPage: setDbPage
  } = useDesigns(itemsPerPage);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setDbPage(page);
    setSelectedDesigns([]); // Clear selections when changing pages
    window.scrollTo(0, 0);
  };
  const handleSort = (field: string) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedDesigns = React.useMemo(() => {
    const sorted = [...designs].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.field) {
        case 'title':
          return a.title.localeCompare(b.title) * direction;
        case 'sku':
          return a.sku.localeCompare(b.sku) * direction;
        case 'mockups':
          return ((a.mockups?.length || 0) - (b.mockups?.length || 0)) * direction;
        case 'categories':
          return ((a.categories?.length || 0) - (b.categories?.length || 0)) * direction;
        case 'keywords':
          return ((a.keywords?.length || 0) - (b.keywords?.length || 0)) * direction;
        case 'updated_at':
          return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * direction;
        default:
          return 0;
      }
    });
    return sorted;
  }, [designs, sortConfig]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Browse Designs</h2>
            <DesignStats />
          </div>
          <div className="flex items-center space-x-4">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={250}>250 per page</option>
              <option value={500}>500 per page</option>
            </select>
          </div>
        </div>

        <DesignFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="text-center py-8">Loading designs...</div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {designs.length} of {totalCount} designs
              </p>
              <div className="flex items-center gap-2">
                <JaneCsvExportButton
                  designs={designs}
                  selectedDesigns={selectedDesigns.length > 0 ? selectedDesigns : undefined}
                />
                <CsvExportButton 
                  designs={designs} 
                  selectedDesigns={selectedDesigns.length > 0 ? selectedDesigns : undefined} 
                />
              </div>
            </div>
            <DesignList 
              designs={sortedDesigns}
              viewMode={viewMode} 
              onDesignUpdate={loadDesigns}
              selectedDesigns={selectedDesigns}
              onSelectedDesignsChange={setSelectedDesigns}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}