import { supabase } from '../lib/supabase';
import { createWebThumbnail } from '../imageOptimizer';
import { optimizeImage, getImageInfo } from '../imageProcessor';
import type { ImportProgress, DesignData } from './types';
import { formatFileSize } from './utils';

const DOWNLOAD_DELAY = 1000; // 1 second delay

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function processPrintFile(design: DesignData, options: {
  onRequestFileUpload?: (sku: string) => Promise<File | null>;
  backgroundColor: 'white' | 'black';
  updateStatus?: (sku: string, status: ImportProgress['status'], message?: string) => void;
  updateProgress?: (sku: string, step: ImportProgress['progress'][0]['step'], details?: ImportProgress['progress'][0]['details']) => void;
}) {
  try {
    console.log(`🔄 Starting print file processing for ${design.sku}`);
    console.log('🌐 Checking download URL:', design['Download File']);
    
    let printFile: File | null = null;
    let contentType: string | null = null;

    // Check both possible column names for the print file URL
    const downloadUrl = design['print_file']?.trim() || design['Download File']?.trim();
    
    // Handle missing or invalid download URL
    if (!downloadUrl || downloadUrl.trim() === '') {
      console.log('⚠️ Missing download URL for', design.sku);
      options.updateStatus?.(design.sku, 'processing', 'Waiting for file upload');
      options.updateProgress?.(design.sku, 'print-file', { waitingForUpload: true });
      
      if (options.onRequestFileUpload) {
        printFile = await options.onRequestFileUpload(design.sku);
        if (!printFile) {
          throw new Error('No file uploaded');
        }
        contentType = printFile.type;
      } else {
        throw new Error('File upload handler not provided');
      }
    } else {
      // Process URL download
      try {
        const response = await fetch(downloadUrl, {
          mode: 'no-cors',
          headers: {
            'Accept': '*/*'
          }
        });
        
        if (!response.ok) {
          // Add delay before retry
          console.log('⏳ Waiting before retry...');
          await delay(DOWNLOAD_DELAY);
          
          throw new Error(`Download failed: ${response.statusText}`);
        }

        contentType = response.headers.get('Content-Type');
        if (!contentType) {
          // Try to determine type from URL
          if (downloadUrl.toLowerCase().endsWith('.svg')) {
            contentType = 'image/svg+xml';
          } else if (downloadUrl.toLowerCase().endsWith('.png')) {
            contentType = 'image/png';
          } else {
            throw new Error('Could not determine file type');
          }
        }
        
        const blob = await response.blob();
        const ext = contentType === 'image/svg+xml' ? 'svg' : 'png';
        printFile = new File([blob], `${design.sku}.${ext}`, { type: contentType });

        console.log('📦 File downloaded successfully:', {
          sku: design.sku,
          type: contentType,
          size: blob.size
        });

      } catch (error) {
        console.error('Download failed:', error);
        options.updateStatus?.(design.sku, 'processing', 'Download failed - Please upload file');
        options.updateProgress?.(design.sku, 'print-file', { waitingForUpload: true });
        
        if (options.onRequestFileUpload) {
          printFile = await options.onRequestFileUpload(design.sku);
          if (!printFile) {
            throw new Error('No file uploaded');
          }
          contentType = printFile.type;
        } else {
          throw new Error('File upload handler not provided');
        }
      }
    }

    // Optimize file
    let optimizedFile, info;
    try {
      console.log(`🔧 Optimizing file for ${design.sku}`);
      const result = contentType === 'image/svg+xml'
        ? { file: printFile, info: await getImageInfo(printFile) }
        : await optimizeImage(printFile, {
            maxWidth: 2400,
            maxHeight: 2400,
            format: 'png',
            quality: 0.9
          });
      optimizedFile = result.file;
      info = result.info;
    } catch (error) {
      console.error('Error processing print file:', error);
      throw new Error('Failed to process print file');
    }

    // Upload to Supabase Storage
    console.log(`⬆️ Uploading file to storage for ${design.sku}`);
    
    // Upload print file
    const printPath = `prints/${design.sku}.png`;
    const { error: printError } = await supabase.storage
      .from('designs')
      .upload(printPath, optimizedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (printError) {
      console.error('Print file upload error:', printError);
      throw new Error('Failed to upload print file to storage');
    }

    // Create and upload web thumbnail
    const webFile = await createWebThumbnail(optimizedFile, {
      maxSize: 800,
      backgroundColor: options.backgroundColor
    });
    
    const webPath = `prints/${design.sku}_web.png`;
    const { error: webError } = await supabase.storage
      .from('designs')
      .upload(webPath, webFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (webError) {
      console.error('Web file upload error:', webError);
      throw new Error('Failed to upload web thumbnail');
    }

    // Get public URLs
    const { data: { publicUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(printPath);

    const { data: { publicUrl: webUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(webPath);

    return { 
      printUrl: publicUrl,
      thumbUrl: webUrl,
      dimensions: `${info.width}x${info.height}`,
      size: formatFileSize(info.size)
    };
  } catch (error) {
    console.error('Error processing print file:', error);
    throw error;
  }
}