import { supabase } from '../lib/supabase';
import { createWebThumbnail } from '../imageOptimizer';
import type { DesignData } from './types';
import { delay } from './utils';

const DOWNLOAD_DELAY = 2000; // 2 second delay between downloads
const MAX_RETRIES = 3; // Maximum number of retry attempts

export async function processMockups(design: DesignData) {
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
    let retryCount = 0;
    let success = false;

    try {
      // Add delay between downloads
      if (index > 0) {
        console.log(`⏳ Waiting ${DOWNLOAD_DELAY}ms before next download...`);
        await delay(DOWNLOAD_DELAY);
      }

      while (retryCount < MAX_RETRIES && !success) {
        try {
          console.log(`📥 Processing mockup ${index + 1} for ${design.sku} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          // Try different fetch strategies
          let response;
          try {
            response = await fetch(url);
          } catch (fetchError) {
            console.log('First fetch attempt failed, trying with no-cors...');
            response = await fetch(url, { mode: 'no-cors' });
          }
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('Empty response received');
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
            throw new Error('Upload failed');
          }

          // Get public URLs
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

          success = true;
          successfulUploads++;
          console.log(`✅ Mockup ${index + 1} processed successfully`);
          break;

        } catch (error) {
          console.warn(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount < MAX_RETRIES) {
            const waitTime = DOWNLOAD_DELAY * retryCount;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
          }
        }
      }
      
      if (!success) {
        console.warn(`❌ Failed to process mockup ${index + 1} after ${MAX_RETRIES} attempts`);
      }
    } catch (error) {
      console.warn(`Error processing mockup ${index + 1}:`, error);
    }
  }
  
  console.log(`✅ Processed ${successfulUploads} out of ${mockupUrls.length} mockups`);
  return successfulUploads;
}