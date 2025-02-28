import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Save, Plus, X, Crop } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ImageCropper from '../components/mockup/ImageCropper';
import StyleIdInput from '../components/mockup/StyleIdInput';

type Point = { x: number; y: number };

// Common words to exclude from keywords
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
  'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
  'that', 'the', 'to', 'was', 'were', 'will', 'with', 'or',
  'but', 'if'
]);

// Helper function to create optimized versions
async function createWebVersion(file: File, maxSize: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw and compress image
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Failed to create optimized version'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function AddMockupTemplate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [clothingStyleId, setClothingStyleId] = useState('');
  const [colorTags, setColorTags] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [designArea, setDesignArea] = useState<{
    topLeft: Point;
    middleLeft: Point;
    bottomLeft: Point;
    bottomRight: Point;
    middleRight: Point;
    topRight: Point;
    bottomRight: Point;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<string | null>(null);
  const [colorInput, setColorInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Initialize design area with default 4500x5400 box
  const initializeDesignArea = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = 0.5;
    const centerY = 0.5;

    // Calculate box dimensions with 4500x5400 aspect ratio
    const boxWidth = 0.4; // 40% of canvas width
    const boxHeight = boxWidth * (5400/4500);

    setDesignArea({
      topLeft: { x: centerX - boxWidth/2, y: centerY - boxHeight/2 },
      middleLeft: { x: centerX - boxWidth/2, y: centerY },
      bottomLeft: { x: centerX - boxWidth/2, y: centerY + boxHeight/2 },
      bottomRight: { x: centerX + boxWidth/2, y: centerY + boxHeight/2 },
      middleRight: { x: centerX + boxWidth/2, y: centerY },
      topRight: { x: centerX + boxWidth/2, y: centerY - boxHeight/2 }
    });
  };

  // Initialize design area when file is selected
  useEffect(() => {
    if (preview && !designArea) {
      initializeDesignArea();
    }
  }, [preview]);

  // Function to generate keywords from text
  const generateKeywords = (text: string, existingKeywords: string[] = []): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(word => 
        word.length > 1 && // Skip single letters
        !STOP_WORDS.has(word) && // Skip stop words
        !existingKeywords.includes(word) // Skip existing keywords
      );
  };

  // Handle title blur
  const handleTitleBlur = () => {
    if (!title.trim()) return;
    const newKeywords = generateKeywords(title, keywords);
    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
    }
  };

  // Handle style ID blur
  const handleStyleIdBlur = () => {
    if (!clothingStyleId.trim()) return;
    const newKeywords = generateKeywords(clothingStyleId, keywords);
    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
    }
  };

  // Handle color tag add
  const handleAddColorTag = () => {
    if (!colorInput.trim()) return;
    const tag = colorInput.trim();
    if (!colorTags.includes(tag)) {
      setColorTags([...colorTags, tag]);
      // Add color tag as keyword if not already present
      const newKeywords = generateKeywords(tag, keywords);
      if (newKeywords.length > 0) {
        setKeywords([...keywords, ...newKeywords]);
      }
    }
    setColorInput('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFile(file);
    setShowCropper(true);
    setPreview(URL.createObjectURL(file));
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    // Convert data URL to File object
    const response = await fetch(croppedImageUrl);
    const blob = await response.blob();
    const file = new File([blob], originalFile?.name || 'cropped-image.jpg', { type: 'image/jpeg' });
    
    setSelectedFile(file);
    setPreview(croppedImageUrl);
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setPreview(null);
    setOriginalFile(null);
  };

  const handlePointDragStart = (pointKey: string) => {
    setDraggingPoint(pointKey);
  };

  const handlePointDragEnd = () => {
    setDraggingPoint(null);
  };

  const handlePointDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingPoint || !canvasRef.current || !designArea) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    const newDesignArea = { ...designArea };

    if (draggingPoint === 'topLeft') {
      // When dragging top-left point, move all points relative to it
      const deltaX = x - designArea.topLeft.x;
      const deltaY = y - designArea.topLeft.y;

      // Move all points
      Object.keys(newDesignArea).forEach(key => {
        newDesignArea[key as keyof typeof designArea] = {
          x: designArea[key as keyof typeof designArea].x + deltaX,
          y: designArea[key as keyof typeof designArea].y + deltaY
        };
      });
    } else {
      // Allow free movement of other points
      switch (draggingPoint) {
        case 'topRight':
          newDesignArea.topRight = { x, y };
          // Update middle point to stay vertically centered
          newDesignArea.middleRight.x = x;
          newDesignArea.middleRight.y = (y + newDesignArea.bottomRight.y) / 2;
          break;
        case 'bottomRight':
          newDesignArea.bottomRight = { x, y };
          // Update middle point to stay vertically centered
          newDesignArea.middleRight.x = x;
          newDesignArea.middleRight.y = (newDesignArea.topRight.y + y) / 2;
          break;
        case 'bottomLeft':
          newDesignArea.bottomLeft = { x, y };
          // Update middle point to stay vertically centered
          newDesignArea.middleLeft.x = x;
          newDesignArea.middleLeft.y = (newDesignArea.topLeft.y + y) / 2;
          break;
        case 'middleLeft':
          newDesignArea[draggingPoint] = {
            x,
            y: Math.max(newDesignArea.topLeft.y, Math.min(newDesignArea.bottomLeft.y, y))
          };
          break;
        case 'middleRight':
          newDesignArea[draggingPoint] = {
            x,
            y: Math.max(newDesignArea.topRight.y, Math.min(newDesignArea.bottomRight.y, y))
          };
          break;
      }
    }

    setDesignArea(newDesignArea);
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    if (!keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
    }
    setKeywordInput('');
  };

  const handleSubmit = async () => {
    if (!selectedFile || !title || !clothingStyleId || !designArea) {
      toast.error('Please fill in all required fields and set design area');
      return;
    }

    setLoading(true);
    try {
      // First get the clothing style ID
      const { data: styleData, error: styleError } = await supabase
        .from('clothing_styles')
        .select('id')
        .eq('style_id', clothingStyleId)
        .single();

      if (styleError) throw styleError;
      if (!styleData) throw new Error('Style not found');

      // Generate unique filenames for different versions
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.'));
      const baseFileName = `${clothingStyleId}-${title.replace(/\s+/g, '_')}_${timestamp}_${randomStr}`;
      const originalFileName = `${baseFileName}_original${fileExt}`;
      const webFileName = `${baseFileName}_web${fileExt}`;
      const thumbFileName = `${baseFileName}_thumb${fileExt}`;
      
      // Create optimized versions
      const webFile = await createWebVersion(selectedFile, 1200);
      const thumbFile = await createWebVersion(selectedFile, 400);

      // Upload all versions
      const [originalUpload, webUpload, thumbUpload] = await Promise.all([
        supabase.storage
        .from('designs')
        .upload(`mockup-templates/${originalFileName}`, selectedFile),
        supabase.storage
        .from('designs')
        .upload(`mockup-templates/${webFileName}`, webFile),
        supabase.storage
        .from('designs')
        .upload(`mockup-templates/${thumbFileName}`, thumbFile)
      ]);

      if (originalUpload.error) throw originalUpload.error;
      if (webUpload.error) throw webUpload.error;
      if (thumbUpload.error) throw thumbUpload.error;

      // Get public URLs
      const { data: { publicUrl: originalUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(`mockup-templates/${originalFileName}`);
      
      const { data: { publicUrl: webUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(`mockup-templates/${webFileName}`);
      
      const { data: { publicUrl: thumbUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(`mockup-templates/${thumbFileName}`);

      // Create template record
      const { error: dbError } = await supabase
        .from('mockup_templates')
        .insert({
          title,
          clothing_style_id: styleData.id,
          original_filename: selectedFile.name,
          url: webUrl,
          thumbnail_url: thumbUrl,
          original_url: originalUrl,
          design_area: {
            points: [
              designArea.topLeft,
              designArea.middleLeft,
              designArea.bottomLeft,
              designArea.bottomRight,
              designArea.middleRight,
              designArea.topRight
            ]
          },
          color_tags: colorTags,
          keywords
        });

      if (dbError) throw dbError;

      toast.success('Template added successfully');
      navigate('/mockups');
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Failed to add template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add Mockup Template</h2>
          <button
            onClick={() => navigate('/mockups')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Style ID *
                </label>
                <StyleIdInput
                  value={clothingStyleId}
                  onChange={setClothingStyleId}
                  onTitleChange={setTitle}
                  onKeywordsChange={(newKeywords) => {
                    console.log('🔄 Updating keywords:', newKeywords);
                    setKeywords(newKeywords);
                  }}
                  onStyleSelect={(style) => {
                    console.log('🎯 Style selected:', style);
                    setClothingStyleId(style.style_id);
                    // Set title
                    setTitle(style.title);
                    
                    // Set keywords
                    if (style.keywords) {
                      console.log('📦 Setting keywords from style:', style.keywords);
                      setKeywords(style.keywords);
                    }
                  }}
                  onBlur={handleStyleIdBlur}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Color Tags
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddColorTag()}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Add color tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddColorTag}
                    className="px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setColorTags(colorTags.filter((_, i) => i !== index))}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Keywords
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
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
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => setKeywords(keywords.filter((_, i) => i !== index))}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Template Image *
                </label>
                {!preview ? (
                  <label className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        Click to upload mockup image
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <>
                  <div className="mt-4">
                    <div
                      ref={canvasRef}
                      className="relative aspect-square bg-gray-100 rounded-lg"
                      onMouseMove={handlePointDrag}
                      onMouseUp={handlePointDragEnd}
                    >
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Design area points */}
                      {designArea && Object.entries(designArea).map(([key, point]) => (
                        <div
                          key={key}
                          className="absolute w-3 h-3 border-2 border-indigo-600 bg-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:bg-indigo-100 hover:scale-110 transition-transform"
                          style={{
                            left: `${point.x * 100}%`,
                            top: `${point.y * 100}%`
                          }}
                          onMouseDown={() => handlePointDragStart(key)}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                            Point {
                              key === 'topLeft' ? '1' :
                              key === 'middleLeft' ? '2' :
                              key === 'bottomLeft' ? '3' :
                              key === 'bottomRight' ? '4' :
                              key === 'middleRight' ? '5' :
                              '6'
                            }
                          </div>
                        </div>
                      ))}

                      {/* Design area polygon */}
                      {designArea && (
                        <svg
                          className="absolute inset-0 pointer-events-none"
                          style={{ width: '100%', height: '100%' }}
                        >
                          <path
                            d={`
                              M ${designArea.topLeft.x * 100},${designArea.topLeft.y * 100}
                              L ${designArea.topRight.x * 100},${designArea.topRight.y * 100}
                              L ${designArea.middleRight.x * 100},${designArea.middleRight.y * 100}
                              L ${designArea.bottomRight.x * 100},${designArea.bottomRight.y * 100}
                              L ${designArea.bottomLeft.x * 100},${designArea.bottomLeft.y * 100}
                              L ${designArea.middleLeft.x * 100},${designArea.middleLeft.y * 100}
                              Z
                            `}
                            fill="rgba(99, 102, 241, 0.2)"
                            stroke="rgb(99, 102, 241)"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                          />
                        </svg>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Drag points to adjust design area
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowCropper(true)}
                        className="flex items-center px-3 py-2 text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        <Crop className="w-4 h-4 mr-2" />
                        Crop Image
                      </button>
                    </div>
                  </div>
                  {showCropper && preview && (
                    <ImageCropper
                      src={preview}
                      onCropComplete={handleCropComplete}
                      onCancel={handleCropCancel}
                    />
                  )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/mockups')}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedFile || !title || !clothingStyleId || !designArea}
              className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}