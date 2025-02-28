export * from './types';
export * from './processMetadata';
export * from './processPrintFile';
export * from './processMockups';
export * from './processKeywords';
export * from './utils';

import { processMetadata } from './processMetadata';
import { processPrintFile } from './processPrintFile';
import { processMockups } from './processMockups';
import { processKeywords } from './processKeywords';
import type { ImportProgress, DesignData } from './types';

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
        const { printUrl: url, thumbUrl, dimensions, size } = await processPrintFile(design, {
          onRequestFileUpload: options?.onRequestFileUpload,
          backgroundColor: options?.backgroundColor || 'white',
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
        designRecord = await processMetadata(design, printUrl, user.id, {
          updateStatus: (sku, status, message) => {
            updateStatus(sku, status, message);
            if (status === 'success' && message?.includes('already exists')) {
              // Skip further processing for existing designs
              throw new Error('Design already exists');
            }
          }
        });
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
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't treat "already exists" as an error
      if (error instanceof Error && error.message === 'Design already exists') {
        return; // Exit gracefully for existing designs
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateStatus(design.sku, 'error', errorMessage);
      
      // Only re-throw if it's not an "already exists" error
      if (!(error instanceof Error && error.message === 'Design already exists')) {
        throw error;
      }
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