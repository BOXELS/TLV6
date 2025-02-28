import { supabase } from '../lib/supabase';
import type { ImportProgress } from './types';
import { verifyFileExists } from './utils';

export async function processMetadata(
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
    
    // Return early with success status for existing designs
    if (statusCallbacks?.updateStatus) {
      statusCallbacks.updateStatus(design.sku, 'success', 'Design already exists');
      return existing;
    }
    
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