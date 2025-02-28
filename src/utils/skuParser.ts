import type { ParsedSkuResult } from '../types/dtf';

export function parseSku(sku: string, quantity: number = 1): ParsedSkuResult {
  try {
    // Check if SKU follows our pattern with underscores
    const parts = sku.split('_');
    
    if (parts.length === 3) {
      // Valid SKU format
      const designId = parts[0].split('-')[0];
      return {
        valid: true,
        item: {
          designId: designId,
          styleColor: parts[1],
          size: parts[2],
          quantity: quantity,
          originalSku: sku
        }
      };
    } else {
      // Invalid SKU format - create a special "BadSKU" item
      return {
        valid: true, // Set to true so it's included in results
        item: {
          designId: 'BadSKU',
          styleColor: 'BadSKU',
          size: 'BadSKU',
          quantity: quantity,
          originalSku: sku
        }
      };
    }
  } catch (error) {
    console.error('Error parsing SKU:', error);
    return {
      valid: true, // Set to true so it's included in results
      item: {
        designId: 'BadSKU',
        styleColor: 'BadSKU',
        size: 'BadSKU',
        quantity: quantity,
        originalSku: sku
      },
      error: `Failed to parse SKU: ${sku}`
    };
  }
}

export function formatDtfCsv(items: DtfPrintItem[]): string {
  const headers = ['Design ID', 'Style-Color', 'Size', 'Quantity', 'Original SKU'];
  const rows = items.map(item => [
    item.designId,
    item.styleColor,
    item.size,
    item.quantity.toString(),
    item.originalSku
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}