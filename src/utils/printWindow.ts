import type { ShipstationOrder } from '../types/shipstation';
import { parseSku } from './skuParser';
import type { DtfPrintItem } from '../types/dtf';

export function parseDtfItems(orders: ShipstationOrder[]): DtfPrintItem[] {
  console.log('🔄 parseDtfItems called with orders:', {
    count: orders.length,
    firstOrder: {
      orderId: orders[0]?.orderId,
      items: orders[0]?.items.map(i => i.sku),
      tags: orders[0]?.tags
    },
    allOrders: orders.map(o => ({
      orderId: o.orderId,
      items: o.items.map(i => i.sku),
      tags: o.tags
    }))
  });

  const parsedItems = new Map<string, DtfPrintItem>();
  const errors: string[] = [];

  orders.forEach(order => {
    console.log('📦 Processing order:', {
      orderId: order.orderId,
      items: order.items.map(i => ({
        sku: i.sku,
        quantity: i.quantity
      })),
      tags: order.tags
    });

    order.items.forEach(item => {
      console.log('🔍 Processing item:', {
        sku: item.sku,
        quantity: item.quantity,
        orderTags: order.tags
      });

      const result = parseSku(item.sku, item.quantity);
      if (result.valid && result.item) {
        const key = item.sku;
        const existingItem = parsedItems.get(key);
        
        // Add order ID and tags to the item
        const itemWithOrder = {
          ...result.item,
          orderId: order.orderId,
          tags: order.tags || []
        };
        if (existingItem) {
          console.log('➕ Adding quantity to existing item:', {
            sku: key,
            oldQuantity: existingItem.quantity,
            addQuantity: result.item.quantity,
            newQuantity: existingItem.quantity + result.item.quantity
          });
          existingItem.quantity += result.item.quantity;
        } else {
          console.log('✨ Creating new item:', {
            sku: key,
            item: itemWithOrder
          });
          parsedItems.set(key, itemWithOrder);
        }
      } else if (result.error) {
        console.warn('⚠️ SKU parse error:', {
          sku: item.sku,
          error: result.error
        });
        errors.push(result.error);
      }
    });
  });

  if (errors.length > 0) {
    console.warn('Some SKUs could not be parsed:', errors);
  }

  const result = Array.from(parsedItems.values())
    .sort((a, b) => a.designId.localeCompare(b.designId));

  console.log('✅ Parsed DTF items:', {
    count: result.length,
    items: result
  });

  // Convert to array and sort by designId
  return result;
}