import React, { useState } from 'react';
import { Wand2, X, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { processDesignForMockup } from '../../../utils/imageProcessor';
import { uploadMockupFile } from '../../../utils/fileUpload';
import type { DesignFile } from '../../../types/database';
import toast from 'react-hot-toast';

type BulkMockupGeneratorProps = {
  selectedDesigns: DesignFile[];
  onUpdate: () => Promise<void>;
};

type MockupTemplate = {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  design_area: {
    points: { x: number; y: number }[];
  };
  color_tags: string[];
  keywords: string[];
};

export default function BulkMockupGenerator({ selectedDesigns, onUpdate }: BulkMockupGeneratorProps) {
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load mockup templates');
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate templates
  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      template.title.toLowerCase().includes(searchLower) ||
      template.color_tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      template.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleGenerateMockups = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a mockup template');
      return;
    }

    setProcessing(true);
    setProgress({ current: 0, total: selectedDesigns.length });

    try {
      // Load mockup template image
      const mockupImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = selectedTemplate.url;
      });

      // Process each design
      for (let i = 0; i < selectedDesigns.length; i++) {
        const design = selectedDesigns[i];
        setProgress({ current: i + 1, total: selectedDesigns.length });

        try {
          // Load design image
          const designImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = design.print_file_url;
          });

          // Create fabric canvas
          const canvas = document.createElement('canvas');
          canvas.width = mockupImg.width;
          canvas.height = mockupImg.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');

          // Draw mockup template
          ctx.drawImage(mockupImg, 0, 0);

          // Calculate design placement
          const designArea = selectedTemplate.design_area;
          const points = designArea.points;
          
          // Calculate design area bounds
          const left = Math.min(...points.map(p => p.x)) * canvas.width;
          const top = Math.min(...points.map(p => p.y)) * canvas.height;
          const right = Math.max(...points.map(p => p.x)) * canvas.width;
          const bottom = Math.max(...points.map(p => p.y)) * canvas.height;
          
          const width = right - left;
          const height = bottom - top;

          // Scale design to fit area while maintaining aspect ratio
          const designAspectRatio = designImg.height / designImg.width;
          const areaAspectRatio = height / width;
          
          let scale;
          if (areaAspectRatio > designAspectRatio) {
            scale = width / designImg.width;
          } else {
            scale = height / designImg.height;
          }

          // Draw design onto canvas
          ctx.drawImage(
            designImg,
            left,
            top,
            designImg.width * scale,
            designImg.height * scale
          );

          // Convert canvas to blob
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(blob => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            }, 'image/jpeg', 0.95);
          });

          // Create mockup file
          const mockupFile = new File(
            [blob],
            `${design.sku}_mockup_${selectedTemplate.id}.jpg`,
            { type: 'image/jpeg' }
          );

          // Upload mockup
          const { url, thumbUrl } = await uploadMockupFile(
            mockupFile,
            '',
            design.sku,
            design.id,
            { backgroundColor: 'white' }
          );

          // Create mockup record
          await supabase
            .from('design_mockups')
            .insert({
              design_id: design.id,
              url,
              thumb_url: thumbUrl,
              sort_order: (design.mockups?.length || 0)
            });

        } catch (error) {
          console.error(`Error processing design ${design.sku}:`, error);
          toast.error(`Failed to process ${design.sku}`);
        }
      }

      await onUpdate();
      toast.success('Bulk mockup generation complete');
      setShowModal(false);
    } catch (error) {
      console.error('Error in bulk mockup generation:', error);
      toast.error('Failed to generate mockups');
    } finally {
      setProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowModal(true);
          loadTemplates();
        }}
        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        Bulk Mockup
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium">Generate Bulk Mockups</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading templates...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                      }}
                      placeholder="Search templates by title, color tags, or keywords..."
                      className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>

                  {/* Results Count */}
                  <div className="text-sm text-gray-500">
                    Showing {paginatedTemplates.length} of {filteredTemplates.length} templates
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {paginatedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`relative rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-indigo-500 shadow-md'
                            : 'border-gray-200 hover:border-indigo-200'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="aspect-square bg-gray-50">
                          <img
                            src={template.thumbnail_url}
                            alt={template.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-gray-900 text-sm">{template.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t">
              {processing && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Processing designs...</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateMockups}
                  disabled={!selectedTemplate || processing}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {processing ? 'Generating...' : 'Generate Mockups'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}