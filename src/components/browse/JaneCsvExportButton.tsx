import { FileDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DesignFile } from '../../types/database';

type JaneCsvExportButtonProps = {
  designs: DesignFile[];
  selectedDesigns?: DesignFile[];
};

export default function JaneCsvExportButton({ designs, selectedDesigns }: JaneCsvExportButtonProps) {
  const navigate = useNavigate();
  const designsToExport = selectedDesigns || designs;

  const handleExport = () => {
    navigate('/jane-export', { state: { designs: designsToExport } });
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
    >
      <FileDown className="w-4 h-4 mr-2" />
      Jane CSV {selectedDesigns?.length ? `(${selectedDesigns.length})` : ''}
    </button>
  );
}