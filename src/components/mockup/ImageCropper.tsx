import { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop as CropIcon, X } from 'lucide-react';

type ImageCropperProps = {
  src: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
};

export default function ImageCropper({ src, onCropComplete, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image();
    image.src = src;
    image.onload = () => {
      setImgSrc(src);
    };
    image.onerror = () => {
      console.error('Error loading image');
    };
  }, [src]);
  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Calculate actual pixel size
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    const pixelCrop = {
      x: Math.round(completedCrop.x * scaleX),
      y: Math.round(completedCrop.y * scaleY),
      width: Math.round(completedCrop.width * scaleX),
      height: Math.round(completedCrop.height * scaleY)
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      imgRef.current,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Get the data URL
    const croppedImageUrl = canvas.toDataURL('image/jpeg');
    onCropComplete(croppedImageUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Crop Image</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative">
          <ReactCrop
            crop={crop}
            onChange={(c) => {
              setCrop(c);
              setCompletedCrop(c);
            }}
            aspect={aspectRatio}
            className="max-h-[60vh] mx-auto"
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Crop preview"
              className="max-w-full max-h-[60vh] object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <CropIcon className="w-4 h-4 mr-2" />
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}