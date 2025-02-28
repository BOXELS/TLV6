import { supabase } from '../lib/supabase';
import type { DesignFile } from '../types/database';

async function getStoragePathFromUrl(url: string): Promise<string | null> {
  try {
    if (!url) return null;
    const parts = url.split('designs/');
    if (parts.length < 2) return null;
    return parts[1];
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
  }
}

export async function bulkDeleteDesigns(designs: DesignFile[]) {
  if (!designs.length) {
    throw new Error('No designs provided');
  }
  
  const designIds = designs.map(d => d.id);
  console.group('Starting bulk delete operation');
  console.log('Designs to delete:', designs.map(d => ({ id: d.id, sku: d.sku })));

  try {
    // First delete all related records
    console.log('Deleting related records...');
    for (const designId of designIds) {
      console.group(`Deleting related records for design ${designId}`);
      // Delete mockups
      const { error: mockupsError } = await supabase
        .from('design_mockups')
        .delete()
        .eq('design_id', designId);
      console.log('Mockups deleted:', mockupsError ? 'Error' : 'Success');

      // Delete keyword links
      const { error: keywordsError } = await supabase
        .from('design_keyword_links')
        .delete()
        .eq('design_id', designId);
      console.log('Keyword links deleted:', keywordsError ? 'Error' : 'Success');

      // Delete category links  
      const { error: categoriesError } = await supabase
        .from('design_categories')
        .delete()
        .eq('design_id', designId);
      console.log('Category links deleted:', categoriesError ? 'Error' : 'Success');
      console.groupEnd();
    }

    // Then delete main design records
    console.log('Deleting main design records...');
    const { error: deleteError } = await supabase
      .from('design_files')
      .delete()
      .in('id', designIds);

    if (deleteError) {
      console.error('Database deletion error:', deleteError);
      throw deleteError;
    }
    console.log('Main design records deleted successfully');

    const filesToDelete: string[] = [];
    for (const design of designs) {
      console.group(`Processing design ${design.sku}`);
      // Add main design files
      const printPath = await getStoragePathFromUrl(design.print_file_url);
      const webPath = await getStoragePathFromUrl(design.web_file_url);
      if (printPath) filesToDelete.push(printPath);
      if (webPath) filesToDelete.push(webPath);
      console.log('Main files to delete:', { printPath, webPath });

      // Add mockup files
      if (design.mockups?.length) {
        console.log(`Processing ${design.mockups.length} mockups`);
        for (const mockup of design.mockups) {
          const mockupPath = await getStoragePathFromUrl(mockup.url);
          const thumbPath = await getStoragePathFromUrl(mockup.thumb_url);
          if (mockupPath) filesToDelete.push(mockupPath);
          if (thumbPath) filesToDelete.push(thumbPath);
        }
      }
      console.groupEnd();
    }

    // Then delete storage files
    if (filesToDelete.length > 0) {
      console.group('Deleting storage files');
      console.log('Files to delete:', filesToDelete);
      const { error: storageError } = await supabase.storage
        .from('designs')
        .remove(filesToDelete);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw storageError;
      }
      console.log('Storage files deleted successfully');
      console.groupEnd();
    }

    console.log('Bulk delete operation completed successfully');
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('Bulk delete error:', error);
    console.groupEnd();
    throw error;
  }
}

export async function bulkAddKeywords(designs: DesignFile[], keywords: string[]) {
  if (!designs.length || !keywords.length) {
    throw new Error('No designs or keywords provided');
  }

  try {
    // First ensure all keywords exist
    for (const keyword of keywords) {
      const { data: existing } = await supabase
        .from('keywords')
        .select('id')
        .eq('keyword', keyword)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('keywords')
          .insert({ keyword });
      }
    }

    // Get all keyword IDs
    const { data: keywordRecords, error: keywordsError } = await supabase
      .from('keywords')
      .select('id, keyword')
      .in('keyword', keywords);

    if (keywordsError) throw keywordsError;
    if (!keywordRecords?.length) throw new Error('Failed to get keyword IDs');

    // Create keyword links for each design
    const links = designs.flatMap(design =>
      keywordRecords.map(kr => ({
        design_id: design.id,
        keyword_id: kr.id
      }))
    );

    const { error: linksError } = await supabase
      .from('design_keyword_links')
      .upsert(links, { onConflict: 'design_id,keyword_id' });

    if (linksError) throw linksError;
  } catch (error) {
    console.error('Bulk add keywords error:', error);
    throw error;
  }
}

export async function bulkRemoveKeywords(designs: DesignFile[], keywords: string[]) {
  if (!designs.length || !keywords.length) {
    throw new Error('No designs or keywords provided');
  }

  try {
    // Get keyword IDs
    const { data: keywordRecords, error: keywordsError } = await supabase
      .from('keywords')
      .select('id')
      .in('keyword', keywords);

    if (keywordsError) throw keywordsError;
    if (!keywordRecords?.length) return; // No matching keywords to remove

    // Remove keyword links
    const { error: deleteError } = await supabase
      .from('design_keyword_links')
      .delete()
      .in('design_id', designs.map(d => d.id))
      .in('keyword_id', keywordRecords.map(kr => kr.id));

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Bulk remove keywords error:', error);
    throw error;
  }
}

export async function bulkAddCategories(designs: DesignFile[], categoryIds: string[]) {
  if (!designs.length || !categoryIds.length) {
    throw new Error('No designs or categories provided');
  }

  try {
    // First get all keywords associated with the selected categories
    const { data: categoryKeywords, error: keywordsError } = await supabase
      .from('category_keyword_links')
      .select(`
        keywords (
          id,
          keyword
        )
      `)
      .in('category_id', categoryIds);

    if (keywordsError) throw keywordsError;

    // Extract unique keywords
    const keywords = [...new Set(
      categoryKeywords
        ?.map(ck => ck.keywords?.keyword)
        .filter(Boolean) || []
    )];

    const links = designs.flatMap(design =>
      categoryIds.map(categoryId => ({
        design_id: design.id,
        category_id: categoryId
      }))
    );

    const { error } = await supabase
      .from('design_categories')
      .upsert(links, { onConflict: 'design_id,category_id' });

    if (error) throw error;

    // Add keywords if any exist
    if (keywords.length > 0) {
      await bulkAddKeywords(designs, keywords);
    }
  } catch (error) {
    console.error('Bulk add categories error:', error);
    throw error;
  }
}

export async function bulkRemoveCategories(designs: DesignFile[], categoryIds: string[]) {
  if (!designs.length || !categoryIds.length) {
    throw new Error('No designs or categories provided');
  }

  try {
    const { error } = await supabase
      .from('design_categories')
      .delete()
      .in('design_id', designs.map(d => d.id))
      .in('category_id', categoryIds);

    if (error) throw error;
  } catch (error) {
    console.error('Bulk remove categories error:', error);
    throw error;
  }
}