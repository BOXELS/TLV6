import { DesignFile } from '../types/database';
import { supabase } from '../lib/supabase';

// Helper function to handle the CSV download and Jane listing status update
export async function downloadCsv(content: string, filename: string, designs: DesignFile[], options: {
  styleId: string;
  titleAppend: string;
}): Promise<void> {
  if (!content || !filename || !designs?.length) {
    throw new Error('Missing required parameters for CSV download');
  }

  // Create and download the file
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Update jane_designs_listed table
  for (const design of designs) {
    try {
      const { data: existing } = await supabase
        .from('jane_designs_listed')
        .select('id')
        .eq('design_id', design.id)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('jane_designs_listed')
          .update({
            status: 'active',
            style_id: options.styleId,
            title_append: options.titleAppend === 'None (default)' ? null : options.titleAppend,
            updated_at: new Date().toISOString()
          })
          .eq('design_id', design.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('jane_designs_listed')
          .insert({
            design_id: design.id,
            style_id: options.styleId,
            title_append: options.titleAppend === 'None (default)' ? null : options.titleAppend,
            status: 'active',
            listed_by: user.id
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating Jane listing status:', error);
      throw error;
    }
  }
}

export function generateDesignCsv(
  designs: DesignFile[],
  categoryPath: string,
  type: string,
  options: {
    styleId: string;
    isHandmade: string;
    isDigital: string;
    hasFreeShipping: string;
    status: string;
    shippingFirst: string;
    shippingAdditional: string;
    description: string;
    titleAppend: string;
    variants: Array<{
      value: string;
      customLabel: string;
      abbreviation: string;
      name?: string; // Add name field for direct value access
    }>;
    secondaryVariants: Array<{
      value: string;
      customLabel: string;
      abbreviation: string;
      price: string;
      weightOz: string;
      stock: string;
      name?: string; // Add name field for direct value access
    }>;
  }
): string {
  // CSV headers
  const headers = [
    'Product SKU',
    'Name',
    'Product URL Path',
    'Product Category',
    'Type',
    'Is Handmade',
    'Is Digital',
    'Has Free Shipping',
    'Shipping Rate First',
    'Shipping Rate Additional',
    'Primary Variant',
    'Secondary Variant',
    'Variant SKU',
    'Primary Variant Value',
    'Primary Variant Custom Label',
    'Secondary Variant Value',
    'Secondary Variant Custom Label',
    'Description',
    'Price',
    'Stock',
    'Weight (in ounces)',
    'Status',
    'Main Image Url',
    // Additional image URLs
    ...Array(10).fill(0).map((_, i) => `Additional Image Url #${i + 1}`)
  ];

  // Convert designs to CSV rows
  const rows = designs.map(design => {
    // Generate URL path and limit to 100 chars, trim any trailing hyphens
    const urlPath = design.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 100)
      .replace(/-+$/, '');

    const mainMockup = design.mockups?.find(m => m.is_main);
    const mainImageUrl = mainMockup?.url || design.mockups?.[0]?.url || '';
    const additionalImages = design.mockups?.filter(m => !m.is_main)?.map(m => m.url) || [];

    const variantRows = [];
    
    // Add parent row first
    // Only parent row gets the common fields
    variantRows.push([
      design.sku,
      options.titleAppend === 'None (default)' ? design.title : `${design.title} ${options.titleAppend}`,
      urlPath,
      categoryPath || '',
      type || '',
      options.isHandmade,
      options.isDigital,
      options.hasFreeShipping,
      options.shippingFirst,
      options.shippingAdditional,
      'Primary Color',  // Primary Variant
      'Generic US',    // Secondary Variant
      '',             // Variant SKU (empty for parent)
      '',             // Primary Variant Value
      '',             // Primary Variant Custom Label
      '',             // Secondary Variant Value
      null,           // Secondary Variant Custom Label
      options.description,  // Description only on parent row
      '',             // Price
      '',             // Stock
      '',             // Weight
      options.status,
      mainImageUrl,
      ...Array(10).fill('').map((_, i) => additionalImages[i] || '')
    ]);

    // Add variant rows
    for (const variant of options.variants) {
      for (const size of options.secondaryVariants) {
        const variantSku = `${design.sku}_${options.styleId}-${variant.abbreviation}_${size.abbreviation}`;
        variantRows.push([
          design.sku,
          '',  // Name (only on parent)
          '',  // Product URL Path (only on parent)
          '',  // Product Category (only on parent)
          '',  // Type (only on parent)
          '',  // Is Handmade (only on parent)
          '',  // Is Digital (only on parent)
          '',  // Has Free Shipping (only on parent)
          '',  // Shipping Rate First (only on parent)
          '',  // Shipping Rate Additional (only on parent)
          '',  // Primary Variant
          '',    // Secondary Variant
          variantSku,    // Variant SKU
          variant.name || variant.customLabel || '',    // Primary Variant Value
          variant.customLabel,    // Primary Variant Custom Label (e.g. "White", "Vintage White")
          size.name || size.customLabel || '',    // Secondary Variant Value
          null,    // Secondary Variant Custom Label - ALWAYS EMPTY
          '',    // Description (only on parent)
          size.price,    // Price
          size.stock,    // Stock
          size.weightOz,    // Weight
          options.status,
          '',  // Main Image URL (only on parent)
          ...Array(10).fill('').map(value => `${value || ''}`)  // Additional Image URLs (only on parent)
        ]);
      }
    }
    return variantRows;
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.flat().map(row => 
      row.map((cell, index) => {
        // Force NULL for Secondary Variant Custom Label (column Q, index 16)
        if (index === 16) return '';
        // Handle other cells
        if (cell === null) return '';
        return cell.includes?.(',') || cell.includes?.('"')
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell;
      }
      ).join(',')
    )
  ].join('\n');

  return csvContent;
}