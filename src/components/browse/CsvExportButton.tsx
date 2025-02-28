import React from 'react';
import { FileDown } from 'lucide-react';
import { generateDesignCsv, downloadCsv } from '../../utils/csvExport';
import type { DesignFile } from '../../types/database';

type CsvExportButtonProps = {
  designs: DesignFile[];
  selectedDesigns?: DesignFile[];
};

export default function CsvExportButton({ designs, selectedDesigns }: CsvExportButtonProps) {
  const handleExport = () => {
    const designsToExport = selectedDesigns?.length ? selectedDesigns : designs;
    const csvContent = generateDesignCsv(designsToExport);
    const filename = `designs-export-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(csvContent, filename);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
    >
      <FileDown className="w-4 h-4 mr-2" />
      CSV Export {selectedDesigns?.length ? `(${selectedDesigns.length})` : ''}
    </button>
  );
}