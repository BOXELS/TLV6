import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Wand2, Move, RotateCw, ZoomIn, Sparkles } from 'lucide-react';
import { fabric } from 'fabric';
import toast from 'react-hot-toast';
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

type MockupGeneratorProps = {
  design: DesignFile;
  onMockupsGenerated?: (mockups: File[]) => void;
};

export default function MockupGenerator({ design, onMockupsGenerated }: MockupGeneratorProps) {
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [designImage, setDesignImage] = useState<fabric.Image | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [warpMode, setWarpMode] = useState(false);
  const [meshPoints, setMeshPoints] = useState<fabric.Circle[]>([]);
  const [meshSize, setMeshSize] = useState({ rows: 4, cols: 4 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate && canvasRef.current && !canvas) {
      initializeFabricCanvas();
    }
  }, [selectedTemplate, canvas]);

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

  const initializeFabricCanvas = async () => {
    if (!canvasRef.current || !selectedTemplate) return;

    const containerWidth = editorRef.current?.clientWidth || 800;
    const aspectRatio = 1; // Square aspect ratio for consistent display

    // Create Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      width: containerWidth,
      height: containerWidth * aspectRatio,
      backgroundColor: '#f9fafb',
      selection: false,
      renderOnAddRemove: true
    });

    // Load mockup template
    const mockupImg = await loadImage(selectedTemplate.url);

    // Add mockup as background
    const bgImage = new fabric.Image(mockupImg, {
      scaleX: canvas.width / mockupImg.width, 
      scaleY: canvas.height / mockupImg.height,
      selectable: false
    });
    canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));

    // Load design with transparency
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
    
    // Calculate scale to fit design area while maintaining 4500x5400 aspect ratio
    const designAspectRatio = 5400/4500;
    const areaAspectRatio = designAreaHeight / designAreaWidth;
    
    let initialScale;
    if (areaAspectRatio > designAspectRatio) {
      // Area is taller than design - fit to width
      initialScale = designAreaWidth / designImg.width;
    } else {
      // Area is wider than design - fit to height
      initialScale = designAreaHeight / (designImg.width * designAspectRatio);
    }

    const designFabricImg = new fabric.Image(designImg, {
      left: designArea.left + designAreaWidth/2,
      top: designArea.top + designAreaHeight/2,
      originX: 'center',
      originY: 'center',
      scaleX: initialScale,
      scaleY: initialScale,
      transparentCorners: true,
      cornerColor: 'rgb(99, 102, 241)',
      cornerStyle: 'circle',
      borderColor: 'rgb(99, 102, 241)',
      cornerSize: 10,
      centeredScaling: true,
      lockUniScaling: true, // Lock aspect ratio
      hasControls: true,
      hasBorders: true,
      minScaleLimit: 0.001, // Allow extremely small scaling
      snapAngle: 15,
      snapThreshold: 10,
      lockScalingFlip: true, // Prevent negative scaling
      padding: 0 // Remove padding that can affect scaling
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

    // Add custom resize control for more precise scaling
    const customResizeControl = new fabric.Control({
      x: 0.5,
      y: 0.5,
      actionHandler: function(eventData, transform, x, y) {
        const target = transform.target;
        const localPoint = target.toLocalPoint(new fabric.Point(x, y), 'center', 'center');
        const stroke = target.strokeWidth || 0;
        const minScale = target.minScaleLimit || 0.01;
        
        // Calculate scale without maintaining aspect ratio
        let scaleX = Math.abs(localPoint.x / ((target.width + stroke) / 2));
        let scaleY = Math.abs(localPoint.y / ((target.height + stroke) / 2));
        
        // Apply minimum scale limits
        scaleX = Math.max(scaleX, minScale);
        scaleY = Math.max(scaleY, minScale);
        
        // Apply scales smoothly
        target.set({
          scaleX: scaleX,
          scaleY: scaleY
        });
        
        return true;
      },
      cursorStyle: 'se-resize',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        const size = 10;
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
        ctx.beginPath();
        ctx.arc(0, 0, size/2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgb(99, 102, 241)';
        ctx.fill();
        ctx.restore();
      }
    });

    designFabricImg.controls.customResize = customResizeControl;

    // Add warp points
    const createMeshPoints = () => {
      const bounds = designFabricImg.getBoundingRect();
      const points: fabric.Circle[] = [];
      
      // Create grid of control points
      for (let row = 0; row <= meshSize.rows; row++) {
        for (let col = 0; col <= meshSize.cols; col++) {
          const x = bounds.left + (col / meshSize.cols) * bounds.width;
          const y = bounds.top + (row / meshSize.rows) * bounds.height;
          
          const point = new fabric.Circle({
            left: x,
            top: y,
            radius: 4,
            fill: 'rgb(99, 102, 241)',
            stroke: 'white',
            strokeWidth: 1,
            originX: 'center',
            originY: 'center',
            hasBorders: false,
            hasControls: false,
            selectable: true,
            evented: true,
            data: { row, col }
          });
          
          point.on('moving', () => {
            requestAnimationFrame(() => applyWarpTransform());
          });
          
          points.push(point);
          canvas.add(point);
        }
      }
      
      return points;
    };

    // Create mesh lines
    const createMeshLines = () => {
      const lines: fabric.Line[] = [];
      const bounds = designFabricImg.getBoundingRect();
      
      // Vertical lines
      for (let col = 0; col <= meshSize.cols; col++) {
        const x = bounds.left + (col / meshSize.cols) * bounds.width;
        const line = new fabric.Line(
          [x, bounds.top, x, bounds.top + bounds.height],
          {
            stroke: 'rgba(99, 102, 241, 0.3)',
            selectable: false,
            evented: false
          }
        );
        lines.push(line);
      }
      
      // Horizontal lines
      for (let row = 0; row <= meshSize.rows; row++) {
        const y = bounds.top + (row / meshSize.rows) * bounds.height;
        const line = new fabric.Line(
          [bounds.left, y, bounds.left + bounds.width, y],
          {
            stroke: 'rgba(99, 102, 241, 0.3)',
            selectable: false,
            evented: false
          }
        );
        lines.push(line);
      }
      
      return lines;
    };

    // Add mesh points and lines
    const points = createMeshPoints();
    const lines = createMeshLines();
    
    points.forEach(point => {
      point.on('moving', () => {
        applyWarpTransform();
      });
      canvas.add(point);
    });
    
    lines.forEach(line => canvas.add(line));
    setMeshPoints(points);

    // Hide mesh by default
    points.forEach(p => p.set({ visible: false }));
    lines.forEach(l => l.set({ visible: false }));

    // Scale design to fit design area while maintaining aspect ratio
    // Position design in center of design area using templatePoints
    const designAreaCenterX = (templatePoints[0].x + templatePoints[2].x) / 2 * canvas.width;
    const designAreaCenterY = (templatePoints[0].y + templatePoints[2].y) / 2 * canvas.height;
    
    designFabricImg.left = designAreaCenterX;
    designFabricImg.top = designAreaCenterY;

    // Add design to canvas
    canvas.add(designFabricImg);
    setDesignImage(designFabricImg);
    designFabricImg.setCoords();
    setFabricCanvas(canvas);

    // Add event handlers
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;
            
      // Maintain aspect ratio
      if (obj === designFabricImg) {
        const scale = Math.max(obj.scaleX || 1, obj.scaleY || 1);
        obj.set({
          scaleX: scale,
          scaleY: scale * designAspectRatio
        });
      }
      
      obj.setCoords();
      canvas.renderAll();
    });

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      // Keep object within design area bounds with margin
      const bound = obj.getBoundingRect();
      const margin = Math.min(designAreaWidth, designAreaHeight) * 0.1;
      
      if (bound.left < designArea.left - margin) {
        obj.left = designArea.left - margin;
      }
      if (bound.top < designArea.top - margin) {
        obj.top = designArea.top - margin;
      }
      if (bound.left + bound.width > designArea.right + margin) {
        obj.left = designArea.right + margin - bound.width;
      }
      if (bound.top + bound.height > designArea.bottom + margin) {
        obj.top = designArea.bottom + margin - bound.height;
      }
      
      obj.setCoords();
    });

    // Initial render
    canvas.renderAll();
  };

  const applyWarpTransform = () => {
    if (!designImage || !fabricCanvas) return;

    // Get the design's dimensions and position
    const bounds = designImage.getBoundingRect(true);
    const angle = designImage.angle || 0;

    // Save current state
    const currentState = {
      left: designImage.left,
      top: designImage.top,
      scaleX: designImage.scaleX,
      scaleY: designImage.scaleY,
      angle: designImage.angle
    };

    try {
      // Get current mesh points
      const meshData = meshPoints.map(point => {
        // Convert point position to be relative to design bounds
        const p = fabric.util.rotatePoint(
          new fabric.Point(point.left || 0, point.top || 0),
          new fabric.Point(bounds.left + bounds.width/2, bounds.top + bounds.height/2),
          fabric.util.degreesToRadians(-angle)
        );
        const relativeX = (p.x - bounds.left) / bounds.width;
        const relativeY = (p.y - bounds.top) / bounds.height;
        return {
          x: relativeX * designImage.width,
          y: relativeY * designImage.height,
          row: point.data.row,
          col: point.data.col
        };
      });

      // Create temporary canvas for warping
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!tempCtx) throw new Error('Failed to get temp canvas context');

      const width = designImage.width;
      const height = designImage.height;
      tempCanvas.width = width;
      tempCanvas.height = height;

      // Clear temp canvas
      tempCtx.clearRect(0, 0, width, height);
      tempCtx.fillStyle = 'rgba(0,0,0,0)';
      tempCtx.fillRect(0, 0, width, height);

      // Draw original design
      tempCtx.drawImage(designImage.getElement(), 0, 0, width, height);
      const imageData = tempCtx.getImageData(0, 0, width, height);
      const newImageData = new ImageData(width, height);

      // Apply mesh warping
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Find containing cell in mesh
          const col = Math.floor(x / (width / meshSize.cols));
          const row = Math.floor(y / (height / meshSize.rows));
          
          // Get corner points of cell
          const topLeft = meshData.find(p => p.row === row && p.col === col);
          const topRight = meshData.find(p => p.row === row && p.col === col + 1);
          const bottomLeft = meshData.find(p => p.row === row + 1 && p.col === col);
          const bottomRight = meshData.find(p => p.row === row + 1 && p.col === col + 1);
          
          if (topLeft && topRight && bottomLeft && bottomRight) {
            // Calculate relative position within cell
            const cellX = (x % (width / meshSize.cols)) / (width / meshSize.cols);
            const cellY = (y % (height / meshSize.rows)) / (height / meshSize.rows);
            
            // Bilinear interpolation
            const srcX = Math.round(
              topLeft.x * (1 - cellX) * (1 - cellY) +
              topRight.x * cellX * (1 - cellY) +
              bottomLeft.x * (1 - cellX) * cellY +
              bottomRight.x * cellX * cellY
            );
            
            const srcY = Math.round(
              topLeft.y * (1 - cellX) * (1 - cellY) +
              topRight.y * cellX * (1 - cellY) +
              bottomLeft.y * (1 - cellX) * cellY +
              bottomRight.y * cellX * cellY
            );
            
            // Bounds checking
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIndex = (srcY * width + srcX) * 4;
              const destIndex = (y * width + x) * 4;
              
              // Copy pixel data
              newImageData.data[destIndex] = imageData.data[srcIndex];
              newImageData.data[destIndex + 1] = imageData.data[srcIndex + 1];
              newImageData.data[destIndex + 2] = imageData.data[srcIndex + 2];
              newImageData.data[destIndex + 3] = imageData.data[srcIndex + 3];
            }
          }
        }
      }

      // Update canvas with warped image
      tempCtx.putImageData(newImageData, 0, 0);
      
      // Update design image with warped version
      const warped = new Image();
      warped.src = tempCanvas.toDataURL();
      warped.onload = async () => {
        if (designImage) {
          designImage.setElement(warped);
          // Restore position and transform
          designImage.set(currentState);
          designImage.setCoords();
          fabricCanvas.requestRenderAll();
          
          // Exit warp mode
          setWarpMode(false);
          meshPoints.forEach(point => point.set({ visible: false }));
          fabricCanvas.getObjects('line').forEach(line => {
            if (line instanceof fabric.Line) {
              line.set({ visible: false });
            }
          });
          fabricCanvas.requestRenderAll();
          
          toast.success('Warp applied successfully');
        }
      };
    } catch (error) {
      console.error('Error applying warp transform:', error);
      toast.error('Failed to apply warp effect');
      // Restore original state on error
      if (designImage) {
        designImage.set(currentState);
        designImage.setCoords();
        fabricCanvas.requestRenderAll();
      }
    }
  };

  // Toggle warp mode
  const toggleWarpMode = () => {
    if (!fabricCanvas || !designImage) return;

    // Clear existing mesh
    meshPoints.forEach(point => {
      fabricCanvas.remove(point);
      point.dispose();
    });
    fabricCanvas.getObjects('line').forEach(line => {
      fabricCanvas.remove(line);
      if (line instanceof fabric.Line) line.dispose();
    });
    
    setWarpMode(!warpMode);
    
    if (!warpMode) {
      // Create new mesh when entering warp mode
      const bounds = designImage.getBoundingRect();
      const points: fabric.Circle[] = [];
      const lines: fabric.Line[] = [];
      
      // Create grid of control points
      for (let row = 0; row <= meshSize.rows; row++) {
        for (let col = 0; col <= meshSize.cols; col++) {
          const x = bounds.left + (col / meshSize.cols) * bounds.width;
          const y = bounds.top + (row / meshSize.rows) * bounds.height;
          
          const point = new fabric.Circle({
            left: x,
            top: y,
            radius: 4,
            fill: 'rgb(99, 102, 241)',
            stroke: 'white',
            strokeWidth: 1,
            originX: 'center',
            originY: 'center',
            hasBorders: false,
            hasControls: false,
            selectable: true,
            evented: true,
            data: { row, col }
          });
          
          point.on('moving', () => {
            requestAnimationFrame(() => applyWarpTransform());
          });
          
          points.push(point);
          fabricCanvas.add(point);
        }
      }
      
      // Create mesh lines
      for (let col = 0; col <= meshSize.cols; col++) {
        const x = bounds.left + (col / meshSize.cols) * bounds.width;
        const line = new fabric.Line(
          [x, bounds.top, x, bounds.top + bounds.height],
          {
            stroke: 'rgba(99, 102, 241, 0.3)',
            selectable: false,
            evented: false
          }
        );
        lines.push(line);
        fabricCanvas.add(line);
      }
      
      for (let row = 0; row <= meshSize.rows; row++) {
        const y = bounds.top + (row / meshSize.rows) * bounds.height;
        const line = new fabric.Line(
          [bounds.left, y, bounds.left + bounds.width, y],
          {
            stroke: 'rgba(99, 102, 241, 0.3)',
            selectable: false,
            evented: false
          }
        );
        lines.push(line);
        fabricCanvas.add(line);
      }
      
      setMeshPoints(points);
      fabricCanvas.requestRenderAll();
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const generateMockup = async (template: MockupTemplate) => {
    setGenerating(true);
    setSelectedTemplate(template);
    const toastId = toast.loading('Generating mockup...');

    try {
      if (!fabricCanvas || !designImage) {
        throw new Error('Canvas not initialized');
      }

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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Wand2 className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">Mockup Generator</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/mockups/v2/${design.id}`)}
            className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate V2
          </button>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Editor */}
      {selectedTemplate && (
        <div ref={editorRef} className="mb-6">
          <div className="relative">
            <canvas ref={canvasRef} className="w-full" />
            
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  if (designImage) {
                    const angle = (designImage.angle || 0) + 90;
                    designImage.rotate(angle);
                    if (warpMode) applyWarpTransform();
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
                    if (warpMode) applyWarpTransform();
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
                  if (designImage) {
                    const center = fabricCanvas?.getCenter();
                    if (center) {
                      designImage.setPositionByOrigin(
                        new fabric.Point(center.left, center.top),
                        'center',
                        'center'
                      );
                    }
                    if (warpMode) applyWarpTransform();
                    fabricCanvas?.renderAll();
                  }
                }}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                title="Center"
              >
                <Move className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={toggleWarpMode}
                className={`p-2 rounded-full shadow-lg ${
                  warpMode 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="Toggle Warp Mode"
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
              {warpMode && (
                <div className="absolute top-16 right-0 bg-white rounded-lg shadow-lg p-4 min-w-[200px]">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grid Size</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          min="2"
                          max="8"
                          value={meshSize.rows}
                          onChange={(e) => {
                            const value = Math.max(2, Math.min(8, parseInt(e.target.value)));
                            setMeshSize(prev => ({ ...prev, rows: value }));
                          }}
                          className="w-20 rounded-md border-gray-300"
                        />
                        <span className="text-gray-500">×</span>
                        <input
                          type="number"
                          min="2"
                          max="8"
                          value={meshSize.cols}
                          onChange={(e) => {
                            const value = Math.max(2, Math.min(8, parseInt(e.target.value)));
                            setMeshSize(prev => ({ ...prev, cols: value }));
                          }}
                          className="w-20 rounded-md border-gray-300"
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={applyWarpTransform}
                          className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                          Apply Warp
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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
              title={warpMode ? 'Exit warp mode before generating' : undefined}
            >
              {generating ? 'Generating...' : 'Generate Mockup'}
            </button>
          </div>
        </div>
      )}

      {/* Templates grid */