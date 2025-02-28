import { supabase } from '../lib/supabase';
import type { DesignData } from './types';

export async function processKeywords(design: DesignData) {
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