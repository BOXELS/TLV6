export type ImageInfo = {
  width: number;
  height: number;
  size: number;
  format?: string;
};

import { fabric } from 'fabric';

// Export optimizeImage function
export async function optimizeImage(file: File, options: {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
} = {}): Promise<{ file: File; info: ImageInfo }> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // Handle SVG files
    if (file.type === 'image/svg+xml') {
      svgToPng(file, {
        width: maxWidth,
        height: maxHeight,
        backgroundColor: 'white'
      }).then(resolve).catch(reject);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    img.onload = () => {
      try {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(img.src); // Clean up

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Create new file
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `.${format}`),
              { type: format === 'png' ? 'image/png' : 'image/jpeg' }
            );

            getImageInfo(optimizedFile).then(info => {
              resolve({ file: optimizedFile, info });
            }).catch(reject);
          },
          `image/${format}`,
          format === 'png' ? undefined : quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}
type Point = { x: number; y: number };

// Define mesh size for warping
const meshSize = { rows: 4, cols: 4 };

// Function to create displacement map from fabric texture
async function createDisplacementMap(
  fabricImage: HTMLImageElement,
  strength: number = 0.15
): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  canvas.width = fabricImage.width;
  canvas.height = fabricImage.height;

  // Draw fabric texture
  ctx.drawImage(fabricImage, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale and adjust strength
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const displacement = (gray - 128) * strength;
    
    // Store displacement in R and G channels
    data[i] = 128 + displacement; // X displacement
    data[i + 1] = 128 + displacement; // Y displacement
    data[i + 2] = gray; // Keep grayscale for height map
    data[i + 3] = 255; // Full alpha
  }

  return imageData;
}

// Function to apply fabric texture to design
async function applyFabricTexture(
  designCanvas: HTMLCanvasElement,
  displacementMap: ImageData,
  strength: number = 1.0
): Promise<HTMLCanvasElement> {
  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('Failed to get output canvas context');

  outputCanvas.width = designCanvas.width;
  outputCanvas.height = designCanvas.height;

  // Get design image data
  const designCtx = designCanvas.getContext('2d');
  if (!designCtx) throw new Error('Failed to get design canvas context');
  const designData = designCtx.getImageData(0, 0, designCanvas.width, designCanvas.height);

  // Create output image data
  const outputData = outputCtx.createImageData(designCanvas.width, designCanvas.height);

  // Apply displacement mapping
  for (let y = 0; y < designCanvas.height; y++) {
    for (let x = 0; x < designCanvas.width; x++) {
      const i = (y * designCanvas.width + x) * 4;
      
      // Get displacement values
      const mapX = Math.floor((x / designCanvas.width) * displacementMap.width);
      const mapY = Math.floor((y / designCanvas.height) * displacementMap.height);
      const mapI = (mapY * displacementMap.width + mapX) * 4;
      
      // Calculate displacement
      const dx = ((displacementMap.data[mapI] - 128) / 128) * strength;
      const dy = ((displacementMap.data[mapI + 1] - 128) / 128) * strength;
      
      // Calculate source position with displacement
      const srcX = Math.max(0, Math.min(designCanvas.width - 1, x + dx));
      const srcY = Math.max(0, Math.min(designCanvas.height - 1, y + dy));
      
      // Bilinear interpolation
      const x1 = Math.floor(srcX);
      const y1 = Math.floor(srcY);
      const x2 = Math.min(x1 + 1, designCanvas.width - 1);
      const y2 = Math.min(y1 + 1, designCanvas.height - 1);
      
      const fx = srcX - x1;
      const fy = srcY - y1;
      
      // Get surrounding pixels
      const p11 = (y1 * designCanvas.width + x1) * 4;
      const p12 = (y1 * designCanvas.width + x2) * 4;
      const p21 = (y2 * designCanvas.width + x1) * 4;
      const p22 = (y2 * designCanvas.width + x2) * 4;
      
      // Interpolate colors
      for (let c = 0; c < 4; c++) {
        const c11 = designData.data[p11 + c];
        const c12 = designData.data[p12 + c];
        const c21 = designData.data[p21 + c];
        const c22 = designData.data[p22 + c];
        
        outputData.data[i + c] = Math.round(
          c11 * (1 - fx) * (1 - fy) +
          c12 * fx * (1 - fy) +
          c21 * (1 - fx) * fy +
          c22 * fx * fy
        );
      }
      
      // Apply fabric texture shading
      const height = displacementMap.data[mapI + 2] / 255;
      const shadingStrength = 0.3;
      
      if (outputData.data[i + 3] > 0) { // Only shade non-transparent pixels
        for (let c = 0; c < 3; c++) {
          outputData.data[i + c] = Math.round(
            outputData.data[i + c] * (1 + (height - 0.5) * shadingStrength)
          );
        }
      }
    }
  }

  // Draw output
  outputCtx.putImageData(outputData, 0, 0);
  return outputCanvas;
}

// Function to convert SVG to PNG using Canvas
async function svgToPng(svgFile: File, options: {
  width?: number;
  height?: number;
  backgroundColor?: string;
} = {}): Promise<{ file: File; info: ImageInfo }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        // Calculate dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (options.width && options.height) {
          const scale = Math.min(options.width / width, options.height / height);
          width *= scale;
          height *= scale;
        } else if (options.width) {
          const scale = options.width / width;
          width *= scale;
          height *= scale;
        } else if (options.height) {
          const scale = options.height / height;
          width *= scale;
          height *= scale;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Fill background if specified
        if (options.backgroundColor) {
          ctx.fillStyle = options.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw SVG
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to PNG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert SVG to PNG'));
              return;
            }

            const pngFile = new File([blob], svgFile.name.replace(/\.svg$/, '.png'), {
              type: 'image/png'
            });

            resolve({
              file: pngFile,
              info: {
                width,
                height,
                size: blob.size,
                format: 'png'
              }
            });
          },
          'image/png',
          1.0 // Use maximum quality for SVG conversion
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG'));
    };

    // Load SVG file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read SVG file'));
    reader.readAsDataURL(svgFile);
  });
}

export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        format: file.type.split('/')[1] || 'unknown'
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function processDesignForMockup(
  designImage: fabric.Image,
  mockupImage: HTMLImageElement,
  designArea: { points: { x: number; y: number }[] },
  options: {
    textureStrength?: number;
    displacementStrength?: number;
  } = {}
): Promise<fabric.Image> {
  try {
    const {
      textureStrength = 0.15,
      displacementStrength = 0.1
    } = options;

    // Get design element and dimensions
    const designElement = designImage.getElement();
    if (!designElement) throw new Error('Failed to get design element');

    // Create displacement map from mockup texture
    const displacementMap = await createDisplacementMap(mockupImage, textureStrength);
    
    // Create a temporary canvas to get design image data
    const processCanvas = document.createElement('canvas');
    const processCtx = processCanvas.getContext('2d');
    if (!processCtx) throw new Error('Failed to get canvas context');
    
    // Draw design onto temp canvas
    processCanvas.width = designElement.width || 0;
    processCanvas.height = designElement.height || 0;
    processCtx.drawImage(designElement, 0, 0);
    
    // Apply fabric texture and displacement
    const texturedCanvas = await applyFabricTexture(
      processCanvas,
      displacementMap,
      displacementStrength
    );
    
    // Create new fabric.Image with textured design
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(texturedCanvas.toDataURL(), img => {
        if (!img) {
          reject(new Error('Failed to create textured image'));
          return;
        }

        try {
          // Copy original image properties
          img.set(designImage.toObject());
          // Ensure proper rendering
          img.setCoords();
          resolve(img);
        } catch (error) {
          reject(error);
        }
      }, { crossOrigin: 'anonymous' });
    });
  } catch (error) {
    console.error('Error processing design image:', error);
    throw error;
  }
}