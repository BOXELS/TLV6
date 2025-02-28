import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, FileDown, FileImage, Tag } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAdmin } from '../hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { processImport, type ImportProgress, generateFailedImportsCsv } from '../utils/csvImport';

export default function ImportCsv() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [importStatuses, setImportStatuses] = useState<ImportProgress[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<'white' | 'black'>('white');
  const [waitingForUpload, setWaitingForUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('📁 Selected file:', file.name);
    setSelectedFile(file);

    if (!file.name.endsWith('.csv')) {
      console.error('❌ Invalid file type:', file.type);
      toast.error('Please select a CSV file');
      return;
    }

    setImportStatuses([]);
    setCurrentRowIndex(0);
    setProcessingComplete(false);
    
    // Parse CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      
      console.log('📊 Parsing CSV file...');
      Papa.parse(event.target.result as string, {
        header: true,
        complete: (results) => {
          console.log('✅ CSV parsed successfully:', {
            rows: results.data.length,
            fields: Object.keys(results.data[0] || {})
          });
          setParsedData(results.data);
        },
        error: (error) => {
          console.error('❌ CSV parse error:', error);
          toast.error('Failed to parse CSV file');
        }
      });
    };
    reader.onerror = () => {
      console.error('❌ File read error');
      toast.error('Failed to read CSV file');
    };
    reader.readAsText(file);
  };

  const handleNextRow = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (currentRowIndex >= parsedData.length) {
      setProcessingComplete(true);
      return;
    }
    setImporting(true);
    
    try {
      const currentRow = parsedData[currentRowIndex];
      await processImport([currentRow], setImportStatuses, {
        onRequestFileUpload: handleFileUpload,
        backgroundColor
      });
      
      // Always increment row counter and continue
      setCurrentRowIndex(prev => prev + 1);
      
      if (currentRowIndex + 1 >= parsedData.length) {
        setProcessingComplete(true);
        toast.success('All rows processed successfully');
        
        // Show completion message with summary
        const successCount = importStatuses.filter(s => s.status === 'success').length;
        const existingCount = importStatuses.filter(s => 
          s.status === 'success' && s.message?.includes('already exists')
        ).length;
        const newCount = successCount - existingCount;
        
        toast.success(
          `Import complete: ${newCount} new designs, ${existingCount} existing designs`
        );
        
        // Navigate after a short delay to show the message
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
      
      // Don't show error toast for existing designs
      if (!(error instanceof Error && error.message.includes('already exists'))) {
        toast.error(error instanceof Error ? error.message : 'Failed to process CSV');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (sku: string): Promise<File | null> => {
    return new Promise((resolve) => {
      setWaitingForUpload(sku);
      toast.loading(`Please select the print file for ${sku}...`);
      
      const handleUpload = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        setWaitingForUpload(null);
        toast.dismiss();
        
        if (file) {
          toast.success(`File selected for ${sku}`);
        } else {
          toast.error(`No file selected for ${sku}`);
        }
        
        resolve(file || null);
        
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.onchange = null;
        }
      };
      
      if (fileInputRef.current) {
        fileInputRef.current.onchange = handleUpload;
        fileInputRef.current.click();
      } else {
        toast.error('File input not available');
        resolve(null);
      }
    });
  };

  const getProgressText = () => {
    if (!parsedData.length) return '';
    return `Processing row ${currentRowIndex + 1} of ${parsedData.length}`;
  };
  if (adminLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          You need admin privileges to access this page.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Import CSV</h2>
            {parsedData.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {getProgressText()}
              </p>
            )}
          </div>
        </div>

        {/* Hidden file input for manual uploads */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".png,.svg"
        />

        <div className="bg-white rounded-lg shadow-sm">
          {/* File Upload Section */}
          <div className="p-6 border-b">
            <div className="max-w-xl">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Legacy Data
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Import designs from a CSV file. The file should include titles, SKUs, keywords,
                print file URLs, and mockup image URLs.
              </p>

              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm text-gray-500">
                    {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {selectedFile && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-700">Background Color:</label>
                    <select
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value as 'white' | 'black')}
                      className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="white">White</option>
                      <option value="black">Black</option>
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={handleNextRow}
                      disabled={importing || processingComplete}
                      className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {importing ? 'Processing...' : processingComplete ? 'Complete' : currentRowIndex === 0 ? 'Start Import' : 'Next Row'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Import Status Section */}
          {importStatuses.length > 0 && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import Status</h3>
                <div className="text-sm text-gray-500">
                  Success: {importStatuses.filter(s => s.status === 'success').length} / 
                  Failed: {importStatuses.filter(s => s.status === 'error').length} / 
                  Total: {importStatuses.length}
                </div>
              </div>
              
              <div className="space-y-4">
                {importStatuses.map((status) => (
                  <div 
                    key={status.sku}
                    className={`border rounded-lg p-4 space-y-3 ${
                      status.status === 'processing' ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{status.title}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">{status.sku}</p>
                          {status.waitingForUpload && (
                            <span className="text-sm text-orange-500 flex items-center gap-1">
                              <Upload className="w-4 h-4" />
                              Waiting for file upload...
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        status.status === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : status.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : status.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                      </span>
                    </div>

                    {status.status === 'error' && status.message && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {status.message}
                      </div>
                    )}

                    {status.progress && (
                      <div className="space-y-2">
                        {status.progress.map((step) => (
                          <div 
                            key={step.step}
                            className={`flex items-center justify-between text-sm px-3 py-2 rounded transition-all duration-300 ${
                              step.completed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <span className="capitalize flex items-center gap-2">
                              {step.step === 'metadata' && <FileDown className="w-4 h-4" />}
                              {step.step === 'print-file' && <Upload className="w-4 h-4" />}
                              {step.step === 'mockups' && <FileImage className="w-4 h-4" />}
                              {step.step === 'keywords' && <Tag className="w-4 h-4" />}
                              {step.step}
                            </span>
                            {step.completed && step.details && (
                              <span className="text-xs flex items-center gap-2">
                                {step.step === 'metadata' && step.details.id && (
                                  `ID: ${step.details.id.slice(0, 8)}...`
                                )}
                                {step.step === 'print-file' && step.details.url && (
                                  <>
                                    <div className="flex flex-col items-end gap-1">
                                    <img 
                                      src={step.details.thumbUrl} 
                                      alt="Print file preview"
                                      className="w-12 h-12 object-contain bg-white rounded border"
                                    />
                                    {step.details.dimensions && (
                                      <span className="text-xs text-green-700">
                                        {step.details.dimensions}
                                      </span>
                                    )}
                                    {step.details.size && (
                                      <span className="text-xs text-green-700">
                                        {step.details.size}
                                      </span>
                                    )}
                                    </div>
                                  </>
                                )}
                                {step.step === 'mockups' && step.details.count !== undefined && (
                                  <span className={step.details.count > 0 ? 'text-green-700' : 'text-yellow-600'}>
                                    {step.details.count} mockup{step.details.count !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {step.step === 'keywords' && step.details.count !== undefined && (
                                  <span className={step.details.count > 0 ? 'text-green-700' : 'text-yellow-600'}>
                                    {step.details.count} keyword{step.details.count !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}