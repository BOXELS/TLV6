export type ImageProcessingOptions = {
  maxSize?: number;
  backgroundColor?: 'white' | 'black';
};

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxSize: 800,
  backgroundColor: 'white'
};

export async function createWebThumbnail(file: File, options: ImageProcessingOptions = {}): Promise<File> {
  const { maxSize, backgroundColor } = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Calculate new dimensions (max 800px)
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

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], `web_${file.name}`, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Failed to create thumbnail'));
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