import { supabase } from '../lib/supabase';
import { uploadFile, uploadMockupFile } from './fileUpload';
import type { BulkUploadItem } from '../types/upload';

type UploadResult = {
  success: boolean;
  error?: string;
};

export async function uploadDesignItem(
  item: BulkUploadItem,
  userId: string,
  options: {
    backgroundColor: 'white' | 'black';
    selectedCategories: string[];
    keywords: string[];
    mockupFiles?: File[];
    description?: string;
  }
): Promise<UploadResult> {
  try {
    const fileExt = item.file.name.substring(item.file.name.lastIndexOf('.'));
    const filePath = `prints/${item.sku}${fileExt}`;
    const [id, acronym] = item.sku.split('-');
    
    // Upload the file
    const { printUrl, webUrl } = await uploadFile(item.file, filePath, {
      backgroundColor: options.backgroundColor
    });

    // Insert the design
    const { data: design, error: designError } = await supabase
      .from('design_files')
      .insert({
        sku: `${id}-${acronym || id}`, // Use ID as acronym if none provided
        title: item.baseTitle || item.title,
        description: options.description || '',
        uploaded_by: userId,
        print_file_url: printUrl,
        web_file_url: webUrl,
      })
      .select('id')
      .single();

    if (designError) throw designError;
    if (!design?.id) throw new Error('Failed to create design record');

    // Upload mockups if provided
    if (options.mockupFiles?.length) {
      const mockupUrls = [];
      for (const mockupFile of options.mockupFiles) {
        const { url, thumbUrl } = await uploadMockupFile(mockupFile, '', item.sku, null, {
          backgroundColor: options.backgroundColor
        });
        mockupUrls.push({ url, thumbUrl });
      }

      // Add mockups to database
      const { error: mockupsError } = await supabase
        .from('design_mockups')
        .insert(
          mockupUrls.map(({ url, thumbUrl }, index) => ({
            design_id: design.id,
            url,
            thumb_url: thumbUrl,
           sort_order: index,
           is_main: index === 0 // Set first mockup as main by default
          }))
        );

      if (mockupsError) throw mockupsError;
    }

    // Add categories
    const { error: categoriesError } = await supabase
      .from('design_categories')
      .insert(
        options.selectedCategories.map(categoryId => ({
          design_id: design.id,
          category_id: categoryId,
        }))
      );

    if (categoriesError) throw categoriesError;

    // Add keywords
    if (options.keywords.length > 0) {
      // First ensure all keywords exist
      const { error: keywordsInsertError } = await supabase
        .from('keywords')
        .upsert(
          options.keywords.map(keyword => ({ keyword })),
          { onConflict: 'keyword', ignoreDuplicates: true }
        );
      
      if (keywordsInsertError) throw keywordsInsertError;

      // Get all keyword IDs
      const { data: keywordRecords, error: keywordsError } = await supabase
        .from('keywords')
        .select('id, keyword')
        .in('keyword', options.keywords);

        if (keywordsError) throw keywordsError;

        if (keywordRecords?.length) {
          // Create keyword links
          const { error: linksError } = await supabase
            .from('design_keyword_links')
            .insert(
              keywordRecords.map(kr => ({
                design_id: design.id,
                keyword_id: kr.id
              }))
            );

          if (linksError) throw linksError;
        }
      }

    return { success: true };
  } catch (error) {
    console.error('Error uploading item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}