import { supabase } from '../lib/supabase';
import { createWebThumbnail, type ImageProcessingOptions } from './imageOptimizer';

export async function uploadMockupFile(
  file: File,
  path: string,
  sku: string,
  designId?: string,
  options: ImageProcessingOptions = {}
): Promise<{ url: string; thumbUrl: string; sort_order: number }> {
  try {
    // Get file extension
    const fileExt = file.name.substring(file.name.lastIndexOf('.'));
    // Generate unique identifier
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    // Generate SKU-based filenames
    const mockupName = `${sku}-mockup-${uniqueId}${fileExt}`;
    const thumbName = `${sku}-mockup-${uniqueId}-thumb.jpg`;
    // Create paths
    const mockupPath = `mockups/${mockupName}`;
    const thumbPath = `mockups/${thumbName}`;

    let nextSort = 0;
    
    // Only get sort order if we have a design ID
    if (designId && typeof designId === 'string') {
      console.log('Getting next sort order for design:', designId);
      const { data: maxSort } = await supabase
        .from('design_mockups')
        .select('sort_order')
        .eq('design_id', designId)
        .order('sort_order', { ascending: false })
        .limit(1);
      nextSort = (maxSort?.[0]?.sort_order ?? -1) + 1;
      console.log('Next sort order:', nextSort);
    }


    // Create web-optimized thumbnail
    const thumbFile = await createWebThumbnail(file, {
      ...options,
      maxSize: 400 // Smaller size for mockup thumbnails
    });

    // Upload both files
    const [mockupUpload, thumbUpload] = await Promise.all([
      supabase.storage
        .from('designs')
        .upload(mockupPath, file, {
          cacheControl: '3600',
          upsert: true
        }),
      supabase.storage
        .from('designs')
        .upload(thumbPath, thumbFile, {
          cacheControl: '3600',
          upsert: true
        })
    ]);

    if (mockupUpload.error) {
      throw new Error(`Mockup upload error: ${mockupUpload.error.message}`);
    }
    if (thumbUpload.error) {
      throw new Error(`Thumbnail upload error: ${thumbUpload.error.message}`);
    }

    // Get public URLs
    const { data: { publicUrl: url } } = supabase.storage
      .from('designs')
      .getPublicUrl(mockupPath);

    const { data: { publicUrl: thumbUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(thumbPath);
    
    // Return URLs and metadata
    return { 
      url, 
      thumbUrl,
      sort_order: nextSort
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload mockup file');
  }
}

export async function uploadFile(
  file: File, 
  path: string,
  options: ImageProcessingOptions = {}
): Promise<{ printUrl: string; webUrl: string }> {
  try {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Supported types: ${validTypes.join(', ')}`);
    }

    // Create web-optimized thumbnail
    const webFile = await createWebThumbnail(file, options);

    // Generate web path by replacing the extension with _web.jpg
    const webPath = path.replace(/\.[^/.]+$/, '_web.jpg');

    // Upload both files
    const [printUpload, webUpload] = await Promise.all([
      supabase.storage
        .from('designs')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        }),
      supabase.storage
        .from('designs')
        .upload(webPath, webFile, {
          cacheControl: '3600',
          upsert: true
        })
    ]);

    if (printUpload.error) {
      throw new Error(`Print file upload error: ${printUpload.error.message}`);
    }
    if (webUpload.error) {
      throw new Error(`Web file upload error: ${webUpload.error.message}`);
    }

    // Get public URLs
    const { data: { publicUrl: printUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(path);

    const { data: { publicUrl: webUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(webPath);

    if (!printUrl || !webUrl) {
      throw new Error('Failed to get public URLs for uploaded files');
    }

    return { printUrl, webUrl };
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload file');
  }
}