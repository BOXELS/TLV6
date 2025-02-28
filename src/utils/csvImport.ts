import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import { uploadFile } from './fileUpload';
import { optimizeImage, getImageInfo } from '@/utils/imageProcessor';
import toast from 'react-hot-toast';
import { createWebThumbnail } from './imageOptimizer';

export type ImportProgress = {
  sku: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  title: string;
  message?: string;
  needsPrintFile?: boolean;
  waitingForUpload?: boolean;
  progress: {
    step: 'metadata' | 'print-file' | 'mockups' | 'keywords';
    completed: boolean;
    details?: {
      dimensions?: string;
      size?: string;
      id?: string;
      url?: string;
      thumbUrl?: string;
      count?: number;
      waitingForUpload?: boolean;
    };
  }[];
};

type DesignData = {
  title: string;
  keywords: string;
  'id-number'?: string;
  'created_at'?: string;
  'sku'?: string;
  'print_file'?: string;
  'Download File'?: string;
  mockup1?: string;
  mockup2?: string;
  mockup3?: string;
  mockup4?: string;
  mockup5?: string;
  mockup6?: string;
  mockup7?: string;
  mockup8?: string;
  mockup9?: string;
  mockup10?: string;
};

const BATCH_SIZE = 5; // Process 5 designs at a time

export async function processImport(
  designs: DesignData[],
  onProgress: (progress: ImportProgress[]) => void,
  options?: {
    onRequestFileUpload?: (sku: string) => Promise<File | null>;
    backgroundColor: 'white' | 'black';
  }
): Promise<void> {
  console.log('🚀 Starting CSV import process', {
    designCount: designs.length,
    firstDesign: designs[0]?.sku
  });

  const statuses: ImportProgress[] = designs.map(design => ({
    sku: design.sku,
    title: design.title,
    status: 'pending',
    progress: [
      { step: 'metadata', completed: false },
      { step: 'print-file', completed: false },
      { step: 'mockups', completed: false },
      { step: 'keywords', completed: false }
    ]
  }));

  onProgress(statuses);

  // Process each design
  for (const design of designs) {
    await processDesign(design);
  }

  async function processDesign(design: DesignData) {
    try {
      console.log(`📦 Processing design: ${design.sku}`, {
        title: design.title,
        downloadUrl: design['Download File'],
        keywords: design.keywords?.length || 0
      });

      // Update status to processing
      updateStatus(design.sku, 'processing');

      // Validate required fields
      const sku = design.sku || `${design['id-number']}-${design['id-number']}`;
      if (!sku) {
        console.error('❌ Missing SKU');
        throw new Error('SKU is required');
      }
      if (!design.title) {
        console.error('❌ Missing title');
        throw new Error('Title is required');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Process print file first
      let printUrl: string;
      try {
        console.log(`🖼️ Processing print file for ${design.sku}`);
        const { printUrl: url, thumbUrl, dimensions, size } = await processPrintFile({
          ...design,
          'Download File': design.print_file
        }, {
          onRequestFileUpload: options.onRequestFileUpload,
          backgroundColor: options.backgroundColor,
          updateStatus,
          updateProgress
        });
        printUrl = url;
        console.log(`✅ Print file processed successfully`, {
          sku: design.sku,
          printUrl: url,
          dimensions,
          size
        });
        updateProgress(design.sku, 'print-file', { url: printUrl, thumbUrl, dimensions, size });
      } catch (error) {
        console.error(`❌ Error processing print file for ${design.sku}:`, error);
        console.error('Full design data:', JSON.stringify(design, null, 2));
        throw new Error(`Failed to process print file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 2. Process metadata with print file URL
      let designRecord;
      try {
        console.log(`📝 Processing metadata for ${design.sku}`);
        designRecord = await processMetadata(design, printUrl, user.id, { updateStatus });
        console.log(`✅ Metadata saved successfully`, {
          sku: design.sku,
          designId: designRecord.id
        });
      } catch (error) {
        console.error(`❌ Error processing metadata for ${design.sku}:`, error);
        console.error('Print URL:', printUrl);
        throw new Error(`Failed to save design metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      updateProgress(design.sku, 'metadata', { id: designRecord.id });

      // 3. Process mockups
      let mockupCount = 0;
      try {
        console.log(`🖼️ Processing mockups for ${design.sku}`);
        mockupCount = await processMockups(design);
        console.log(`✅ Mockups processed successfully`, {
          sku: design.sku,
          count: mockupCount
        });
      } catch (error) {
        console.error(`❌ Error processing mockups for ${design.sku}:`, error);
        console.error('Mockup URLs:', Object.entries(design)
          .filter(([key]) => key.startsWith('mockup'))
          .map(([key, value]) => ({ [key]: value }))
        );
        // Don't fail the whole import for mockup errors
      }
      updateProgress(design.sku, 'mockups', { count: mockupCount });

      // 4. Process keywords
      let keywordCount = 0;
      try {
        console.log(`🏷️ Processing keywords for ${design.sku}`);
        keywordCount = await processKeywords(design);
        console.log(`✅ Keywords processed successfully`, {
          sku: design.sku,
          count: keywordCount
        });
      } catch (error) {
        console.error(`❌ Error processing keywords for ${design.sku}:`, error);
        console.error('Keywords:', design.keywords);
        // Don't fail the whole import for keyword errors
      }
      updateProgress(design.sku, 'keywords', { count: keywordCount });

      // Mark as complete
      updateStatus(design.sku, 'success');
    } catch (error) {
      console.error(`❌ Failed to process design ${design.sku}:`, error);
      console.error('Full error context:', {
        sku: design.sku,
        title: design.title,
        downloadUrl: design['Download File'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateStatus(design.sku, 'error', errorMessage);
      throw error; // Re-throw to handle in batch processing
    }
  }

  // Helper function to update status
  function updateStatus(sku: string, status: ImportProgress['status'], message?: string) {
    const newStatuses = statuses.map(s => 
      s.sku === sku ? { ...s, status, message } : s
    );
    onProgress(newStatuses);
  }

  // Helper function to update progress
  function updateProgress(sku: string, step: ImportProgress['progress'][0]['step'], details?: ImportProgress['progress'][0]['details']) {
    const newStatuses = statuses.map(s => 
      s.sku === sku ? {
        ...s,
        progress: s.progress?.map(p => 
          p.step === step ? { ...p, completed: true, details } : p
        )
      } : s
    );
    onProgress(newStatuses);
  }
}

async function processMetadata(
  design: DesignData, 
  printFileUrl: string, 
  userId?: string,
  statusCallbacks?: {
    updateStatus: (sku: string, status: ImportProgress['status'], message?: string) => void;
  }
) {
  if (!userId) {
    console.log('🔑 Getting user ID for metadata processing');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }

  // Convert date format MM.DD.YY to timestamp
  const createdAt = design['created_at'] ? new Date(design['created_at'].split('.').reverse().map(
    (part, i) => i === 0 ? `20${part}` : part
  ).join('-')).toISOString() : new Date().toISOString();

  // Check if design already exists
  console.log(`🔍 Checking if design ${design.sku} already exists`);
  const { data: existing, error: existingError } = await supabase
    .from('design_files').select(`
      *,
      design_mockups (
        id,
        url,
        thumb_url,
        is_main,
        sort_order
      ),
      design_keyword_links!inner (
        keywords!inner (
          keyword
        )
      )
    `)
    .eq('sku', design.sku)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    console.log('✨ Design exists, verifying data...');
    
    if (statusCallbacks?.updateStatus) {
      statusCallbacks.updateStatus(design.sku, 'success', 'Design already exists and is valid');
    }
    
    // Verify print files
    const printFileExists = await verifyFileExists(existing.print_file_url);
    const webFileExists = await verifyFileExists(existing.web_file_url);
    
    if (!printFileExists || !webFileExists) {
      console.warn('⚠️ Missing print or web files');
      throw new Error('Design exists but files are missing');
    }

    // Verify mockups
    const mockupCount = existing.design_mockups?.length || 0;
    const mockupStatus = mockupCount > 0 
      ? `${mockupCount} mockups found` 
      : 'No mockups';

    // Verify keywords
    const keywords = existing.design_keyword_links?.map(link => link.keywords?.keyword).filter(Boolean) || [];
    const keywordStatus = keywords.length > 0
      ? `${keywords.length} keywords found`
      : 'No keywords';

    console.log('✅ Design verification complete:', {
      sku: design.sku,
      title: existing.title,
      mockups: mockupStatus,
      keywords: keywordStatus
    });

    // Return the existing design instead of throwing error
    return existing;
  }

  // Create design record
  console.log(`📝 Creating design record for ${design.sku}`);
  const { data: newDesign, error } = await supabase
    .from('design_files')
    .insert({
      uploaded_by: userId,
      sku: design.sku || `${design['id-number']}-${design['id-number']}`,
      title: design.title,
      print_file_url: printFileUrl,
      web_file_url: printFileUrl,
      created_at: createdAt
    })
    .select()
    .single();

  if (error) throw error;
  return newDesign;
}

// Helper function to verify file exists in storage
async function verifyFileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error verifying file:', error);
    return false;
  }
}

import { getFileFromDrive } from './driveApi';

async function processPrintFile(design: DesignData, options: {
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
      // Process URL download as before
      try {
        const response = await fetch(downloadUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'image/svg+xml,image/png,image/*'
          }
        });
        
        if (!response.ok) {
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

    // Get public URL
    console.log(`🔗 Getting public URLs for ${design.sku}`);
    const { data: { publicUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(printPath);

    // Create web version URL
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

async function processMockups(design: DesignData) {
  const mockupUrls = Object.entries(design)
    .filter(([key, value]) => key.startsWith('mockup') && value)
    .map(([_, value]) => value as string)
    .filter(url => url && url.trim().length > 0);

  console.log(`🖼️ Found ${mockupUrls.length} mockups for ${design.sku}`);
  if (mockupUrls.length === 0) return 0;

  // Get design ID
  console.log(`🔍 Getting design ID for ${design.sku}`);
  const { data: designData } = await supabase
    .from('design_files')
    .select('id')
    .eq('sku', design.sku)
    .single();

  if (!designData) throw new Error('Design not found');

  let successfulUploads = 0;
  // Process each mockup
  for (const [index, url] of mockupUrls.entries()) {
    try {
      console.log(`📥 Processing mockup ${index + 1} for ${design.sku}`);
      // Download mockup
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to download mockup ${index + 1}: ${response.statusText}`);
        continue;
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        console.warn(`Empty mockup file ${index + 1}`);
        continue;
      }

      const mockupFile = new File([blob], `${design.sku}-mockup-${index + 1}.jpg`, { 
        type: 'image/jpeg' 
      });

      // Create thumbnail version
      const thumbFile = await createWebThumbnail(mockupFile, {
        maxSize: 400,
        backgroundColor: 'white'
      });

      const mockupPath = `mockups/${design.sku}-mockup-${index + 1}.jpg`;
      const thumbPath = `mockups/${design.sku}-mockup-${index + 1}_thumb.jpg`;
      // Upload to Supabase Storage
      const [{ error: mockupError }, { error: thumbError }] = await Promise.all([
        supabase.storage
        .from('designs')
        .upload(mockupPath, mockupFile, { upsert: true }),
        supabase.storage
          .from('designs')
          .upload(thumbPath, thumbFile, { upsert: true })
      ]);

      if (mockupError || thumbError) {
        console.error('Upload error:', { mockupError, thumbError });
        continue;
      }

      // Get public URL
      const { data: { publicUrl: mockupUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(mockupPath);

      const { data: { publicUrl: thumbUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(thumbPath);

      // Create mockup record
      await supabase
        .from('design_mockups')
        .insert({
          design_id: designData.id,
          url: mockupUrl,
          thumb_url: thumbUrl,
          sort_order: index,
          is_main: index === 0
        });

      successfulUploads++;
    } catch (error) {
      console.warn(`Error processing mockup ${index + 1}:`, error);
    }
  }
  return successfulUploads;
}

async function processKeywords(design: DesignData) {
  if (!design.keywords) return 0;
  console.log(`🏷️ Processing keywords for ${design.sku}`);

  const keywords = design.keywords
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  console.log(`📝 Found ${keywords.length} keywords for ${design.sku}`);
  if (keywords.length === 0) return 0;

  // Get design ID
  console.log(`🔍 Getting design ID for ${design.sku}`);
  const { data: designData } = await supabase
    .from('design_files')
    .select('id')
    .eq('sku', design.sku)
    .single();

  if (!designData) throw new Error('Design not found');

  let successfulKeywords = 0;
  // Process each keyword
  for (const keyword of keywords) {
    try {
      console.log(`🔄 Processing keyword "${keyword}" for ${design.sku}`);
      // Create keyword if it doesn't exist
      const { data: existingKeyword } = await supabase
        .from('keywords')
        .select('id')
        .eq('keyword', keyword)
        .maybeSingle();

      let keywordId = existingKeyword?.id;

      if (!keywordId) {
        console.log(`➕ Creating new keyword "${keyword}"`);
        const { data: newKeyword, error: createError } = await supabase
          .from('keywords')
          .insert({ keyword })
          .select()
          .single();

        if (createError) throw createError;
        keywordId = newKeyword.id;
      }

      // Create keyword link
      console.log(`🔗 Creating keyword link for "${keyword}"`);
      await supabase
        .from('design_keyword_links')
        .insert({
          design_id: designData.id,
          keyword_id: keywordId
        });

      successfulKeywords++;
    } catch (error) {
      console.warn(`Error processing keyword "${keyword}":`, error);
    }
  }
  return successfulKeywords;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

import { getFileFromDrive } from './driveApi';