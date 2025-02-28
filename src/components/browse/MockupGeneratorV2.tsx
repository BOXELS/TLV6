import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Wand2, RotateCw, ZoomIn, Move } from 'lucide-react';
import { fabric } from 'fabric';
import toast from 'react-hot-toast';
import { processDesignForMockup } from '@/utils/imageProcessor';
import type { DesignFile } from '../../types/database';

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

type MockupGeneratorV2Props = {
  design: DesignFile;
  onMockupsGenerated?: (mockups: File[]) => void;
};

export default function MockupGeneratorV2({ design, onMockupsGenerated }: MockupGeneratorV2Props) {
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [designImage, setDesignImage] = useState<fabric.Image | null>(null);
  const [mockupImage, setMockupImage] = useState<HTMLImageElement | null>(null);
  const [isConstrained, setIsConstrained] = useState<boolean>(true);
  const [isInitialPlacement, setIsInitialPlacement] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialState, setInitialState] = useState<{
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
  } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate && canvasRef.current && !fabricCanvas) {
      initializeFabricCanvas();
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
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

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const initializeFabricCanvas = async () => {
    if (!canvasRef.current || !selectedTemplate) return;

    const containerWidth = editorRef.current?.clientWidth || 800;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerWidth,
      height: containerWidth,
      backgroundColor: '#f9fafb',
      selection: false
    });

    // Load mockup template
    const mockupImg = await loadImage(selectedTemplate.url);
    setMockupImage(mockupImg);
    const bgImage = new fabric.Image(mockupImg, {
      scaleX: canvas.width / mockupImg.width,
      scaleY: canvas.height / mockupImg.height,
      selectable: false
    });
    canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));

    // Load design image
    const designImg = await loadImage(design.print_file_url);
    
    // Get design area points
    const templatePoints = selectedTemplate.design_area.points;
    
    // Calculate design area bounds
    const designArea = {
      left: Math.min(...templatePoints.map(p => p.x)) * canvas.width,
      top: Math.min(...templatePoints.map(p => p.y)) * canvas.height,
      right: Math.max(...templatePoints.map(p => p.x)) * canvas.width,
      bottom: Math.max(...templatePoints.map(p => p.y)) * canvas.height
    };
    
    const designAreaWidth = designArea.right - designArea.left;
    const designAreaHeight = designArea.bottom - designArea.top;
    
    // Calculate scale to fit design area while maintaining aspect ratio
    const designAspectRatio = 5400/4500; // Standard design aspect ratio
    const areaAspectRatio = designAreaHeight / designAreaWidth;
    
    let initialScale;
    if (areaAspectRatio > designAspectRatio) {
      // Area is taller than design - fit to width
      initialScale = designAreaWidth / designImg.width;
    } else {
      // Area is wider than design - fit to height
      initialScale = designAreaHeight / (designImg.width * designAspectRatio);
    }

    // Create design image object
    const designFabricImg = new fabric.Image(designImg, {
      left: designArea.left + designAreaWidth/2,
      top: designArea.top + designAreaHeight/2,
      originX: 'center',
      originY: 'center',
      scaleX: initialScale,
      scaleY: initialScale * designAspectRatio,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: true,
      cornerColor: 'rgb(99, 102, 241)',
      cornerStyle: 'circle',
      borderColor: 'rgb(99, 102, 241)',
      cornerSize: 10,
      centeredScaling: true,
      lockUniScaling: false, // Allow independent scaling
      snapAngle: 15,
      snapThreshold: 10
    });

    // Store initial state
    setInitialState({
      left: designArea.left + designAreaWidth/2,
      top: designArea.top + designAreaHeight/2,
      scaleX: initialScale,
      scaleY: initialScale * designAspectRatio,
      angle: 0
    });

    // Configure control points
    designFabricImg.setControlsVisibility({
      mt: true,
      mb: true,
      ml: true,
      mr: true,
      tl: true,
      tr: true,
      bl: true,
      br: true
    });

    // Add event handlers
    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      // Only apply constraints during initial placement if enabled
      if (isConstrained && isInitialPlacement) {
        const bound = obj.getBoundingRect();
        const margin = Math.min(designAreaWidth, designAreaHeight) * 0.25; // Increased margin
        
        // Calculate center point of design area
        const designAreaCenterX = designArea.left + designAreaWidth/2;
        const designAreaCenterY = designArea.top + designAreaHeight/2;
        
        // Calculate maximum allowed distance from center
        const maxDistanceX = designAreaWidth/2 + margin;
        const maxDistanceY = designAreaHeight/2 + margin;
        
        // Get current distance from center
        const currentX = obj.left - designAreaCenterX;
        const currentY = obj.top - designAreaCenterY;
        
        // Apply soft constraints that pull the object back towards the design area
        if (Math.abs(currentX) > maxDistanceX) {
          const pullback = (Math.abs(currentX) - maxDistanceX) * 0.5;
          obj.left = designAreaCenterX + (currentX > 0 ? maxDistanceX - pullback : -maxDistanceX + pullback);
        }
        if (Math.abs(currentY) > maxDistanceY) {
          const pullback = (Math.abs(currentY) - maxDistanceY) * 0.5;
          obj.top = designAreaCenterY + (currentY > 0 ? maxDistanceY - pullback : -maxDistanceY + pullback);
        }
      }
      
      obj.setCoords();
    });

    canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      // Prevent scaling too small
      const minScale = 0.1;
      if ((obj.scaleX || 0) < minScale || (obj.scaleY || 0) < minScale) {
        obj.set({
          scaleX: minScale,
          scaleY: minScale * designAspectRatio
        });
      }
      
      obj.setCoords();
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      // Only update initial placement if the user has explicitly moved or rotated the object
      if (e.action === 'drag' || e.action === 'rotate') {
        setIsInitialPlacement(false);
      }
      
      // After first modification, allow free movement
      
      // After first modification, mark as no longer in initial placement
      setIsInitialPlacement(false);
      
      // Ensure object stays within reasonable bounds
      const bound = obj.getBoundingRect();
      const maxScale = 5; // Maximum scale factor
      
      if (bound.width > canvas.width * maxScale || bound.height > canvas.height * maxScale) {
        obj.set({
          scaleX: obj.scaleX / 2,
          scaleY: obj.scaleY / 2
        });
      }
      
      obj.setCoords();
      canvas.renderAll();
    });

    // Add design to canvas
    canvas.add(designFabricImg);
    setDesignImage(designFabricImg);
    setFabricCanvas(canvas);

    // Initial render
    canvas.renderAll();
  };

  const generateMockup = async (template: MockupTemplate) => {
    setGenerating(true);
    setSelectedTemplate(template);
    const toastId = toast.loading('Generating mockup...');

    try {
      if (!fabricCanvas || !designImage) {
        throw new Error('Canvas not initialized');
      }

      // Load mockup image
      const mockupImg = await loadImage(template.url);
      
      // Process design image
      const enhancedDesign = await processDesignForMockup(
        designImage,
        mockupImg,
        template.design_area
      );
      
      // Replace current design with enhanced version
      const currentState = {
        left: designImage.left,
        top: designImage.top,
        scaleX: designImage.scaleX,
        scaleY: designImage.scaleY,
        angle: designImage.angle
      };
      
      fabricCanvas.remove(designImage);
      fabricCanvas.add(enhancedDesign);
      
      // Restore position and transform
      enhancedDesign.set(currentState);
      enhancedDesign.setCoords();
      
      setDesignImage(enhancedDesign);
      fabricCanvas.renderAll();

      // Get the final canvas with transformed design
      const dataUrl = fabricCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.95
      });

      // Convert to file
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const mockupFile = new File(
        [blob],
        `${design.sku}_mockup_${template.id}.jpg`,
        { type: 'image/jpeg' }
      );

      if (onMockupsGenerated) {
        onMockupsGenerated([mockupFile]);
      }

      toast.success('Mockup generated successfully', { id: toastId });
    } catch (error) {
      console.error('Error generating mockup:', error);
      toast.error('Failed to generate mockup', { id: toastId });
    } finally {
      setGenerating(false);
      setSelectedTemplate(null);
      setFabricCanvas(null);
      setMockupImage(null);
      setDesignImage(null);
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      template.title.toLowerCase().includes(searchLower) ||
      template.color_tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      template.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Mockup Generator V2</h3>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Editor */}
      {selectedTemplate && (
        <div ref={editorRef} className="mb-6">
          <div className="relative">
            <canvas ref={canvasRef} className="w-full" />
            {/* Reset button */}
            <button
              onClick={() => {
                if (designImage && initialState && fabricCanvas) {
                  setIsInitialPlacement(true);
                  // Reset position and re-enable constraints
                  // Reset position and re-enable initial placement
                  setIsInitialPlacement(true);
                  setIsConstrained(true);
                  designImage.set({
                    left: initialState.left,
                    top: initialState.top,
                    scaleX: initialState.scaleX,
                    scaleY: initialState.scaleY,
                    angle: initialState.angle
                  });
                  designImage.setCoords();
                  fabricCanvas.renderAll();
                  toast.success('Design position reset');
                }
              }}
              className="absolute top-4 left-4 px-3 py-2 text-sm bg-white rounded-md shadow-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Reset Position
            </button>
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              {/* Fabric Texture Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (designImage) {
                      // Apply fabric texture
                      processDesignForMockup(
                        designImage,
                        mockupImage,
                        selectedTemplate.design_area,
                        { textureStrength: 0.15 }
                      ).then(enhancedDesign => {
                        if (fabricCanvas) {
                          fabricCanvas.remove(designImage);
                          fabricCanvas.add(enhancedDesign);
                          setDesignImage(enhancedDesign);
                          fabricCanvas.renderAll();
                          toast.success('Fabric texture applied');
                        }
                      }).catch(error => {
                        console.error('Error applying texture:', error);
                        toast.error('Failed to apply texture');
                      });
                    }
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                  title="Apply Fabric Texture"
                >
                  <Wand2 className="w-5 h-5 text-gray-700" />
                </button>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Texture</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="15"
                    className="w-24"
                    onChange={(e) => {
                      if (designImage) {
                        const strength = parseInt(e.target.value) / 100;
                        processDesignForMockup(
                          designImage,
                          mockupImage,
                          selectedTemplate.design_area,
                          { textureStrength: strength }
                        ).then(enhancedDesign => {
                          if (fabricCanvas) {
                            fabricCanvas.remove(designImage);
                            fabricCanvas.add(enhancedDesign);
                            setDesignImage(enhancedDesign);
                            fabricCanvas.renderAll();
                          }
                        });
                      }
                    }}
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (designImage) {
                    const angle = (designImage.angle || 0) + 90;
                    designImage.rotate(angle);
                    fabricCanvas?.renderAll();
                  }
                }}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => {
                  if (designImage) {
                    const scale = 1.1;
                    designImage.scale(scale);
                    fabricCanvas?.renderAll();
                  }
                }}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                title="Scale Up"
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => {
                  if (designImage && initialState) {
                    designImage.set({
                      left: initialState.left,
                      top: initialState.top
                    });
                    designImage.setCoords();
                    fabricCanvas?.renderAll();
                  }
                }}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                title="Center"
              >
                <Move className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Texture Preview */}
          {designImage && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Texture Preview</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Original</p>
                  <div className="aspect-square bg-white rounded border overflow-hidden">
                    <img
                      src={design.web_file_url}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">With Texture</p>
                  <div className="aspect-square bg-white rounded border overflow-hidden">
                    <canvas ref={canvasRef} className="w-full h-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setFabricCanvas(null);
                setDesignImage(null);
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={() => generateMockup(selectedTemplate)}
              disabled={generating}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Mockup'}
            </button>
            {/* Toggle Constraints Button */}
            <button
              onClick={() => setIsConstrained(!isConstrained)}
              className={`p-2 rounded-full shadow-lg ${
                isConstrained && isInitialPlacement
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title={isConstrained && isInitialPlacement ? 'Disable Constraints' : 'Enable Constraints'}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 14h6m-6-4h6m10 4h-4m4-4h-4M4 6h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Templates grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No mockup templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="relative group">
              <div className="aspect-square bg-gray-50 rounded-lg border overflow-hidden">
                <img
                  src={template.thumbnail_url}
                  alt={template.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {/* Design area overlay */}
                <svg
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polygon
                    points={template.design_area.points
                      .map(p => `${p.x * 100},${p.y * 100}`)
                      .join(' ')}
                    fill="rgba(99, 102, 241, 0.2)"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                </svg>
              </div>

              {/* Template info */}
              <div className="mt-2">
                <h4 className="font-medium text-gray-900 truncate">{template.title}</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {template.color_tags?.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={() => setSelectedTemplate(template)}
                disabled={generating && selectedTemplate?.id === template.id}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <span className="bg-white rounded-lg p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200 flex items-center gap-2">
                  {generating && selectedTemplate?.id === template.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 text-gray-800" />
                      <span className="text-gray-800 font-medium">Generate</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}