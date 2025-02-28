import type { ShipstationCredentials } from '../types/shipstation';
import { supabase } from '../lib/supabase';

const SHIPSTATION_API_BASE = 'https://ssapi.shipstation.com';

// 🛠️ Helper Function for API Requests
async function makeRequest(credentials: ShipstationCredentials, endpoint: string, options: RequestInit = {}) {
  const { apiKey, apiSecret } = credentials;
  const auth = btoa(`${apiKey}:${apiSecret}`);

  const response = await fetch(`${SHIPSTATION_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ShipStation API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// ✅ Fetch Orders
export async function fetchShipstationOrders(credentials: ShipstationCredentials) {
  console.log('🔄 Fetching orders from ShipStation...');
  const endpoint = '/orders?orderStatus=awaiting_shipment&pageSize=100&sortBy=OrderDate&sortDir=DESC&includeShipmentItems=true&includeOrderTags=true';

  // Fetch data from ShipStation API
  const data = await makeRequest(credentials, endpoint);

  // Log raw API response
  console.log('📦 Raw API Response:', data);
  console.log('🏷️ First Order Tags:', data.orders[0]?.tags);
  console.log('🔍 Sample Order Structure:', data.orders[0]);

  // Get tag data from our local database
  const { data: localTags } = await supabase
    .from('shipstation_tags')
    .select('tag_id, name, color');

  const tagMap = (localTags || []).reduce((acc, tag) => ({
    ...acc,
    [tag.tag_id]: { name: tag.name, color: tag.color }
  }), {});

  // Process and map the orders
  const filteredOrders = data.orders.map((order: any) => {
    const orderTags = Array.isArray(order.tags) 
      ? order.tags.map((tag: any) => ({
          tagId: tag.tagId,
          name: tagMap[tag.tagId]?.name || 'Unknown',
          color: tagMap[tag.tagId]?.color || '#6B7280'
        }))
      : Array.isArray(order.tagIds)
      ? order.tagIds.map((tagId: number) => ({
          tagId,
          name: tagMap[tagId]?.name || 'Unknown',
          color: tagMap[tagId]?.color || '#6B7280'
        }))
      : [];

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      orderStatus: order.orderStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      orderTotal: parseFloat(order.orderTotal) || 0,
      items: order.items
        .filter((item: any) => item.sku && item.quantity > 0)
        .map((item: any) => ({
          lineItemId: item.lineItemId,
          sku: item.sku,
          name: item.name,
          quantity: Math.max(0, parseInt(item.quantity, 10) || 0),
          unitPrice: parseFloat(item.unitPrice) || 0,
          options: item.options || []
        })),
      tags: orderTags,
      notes: order.notes,
      gift: order.gift || false,
      notes: order.customerNotes || '',
      internalNotes: order.internalNotes || '',
      shippingPaid: parseFloat(order.shippingAmount) || 0,
      amountPaid: parseFloat(order.amountPaid) || 0
    };
  });

  // Final Debug Logs
  console.log('✨ Processed Orders:', filteredOrders.map(order => ({
    orderNumber: order.orderNumber,
    tags: order.tags
  })));

  console.log(`✅ Fetched ${filteredOrders.length} orders`);
  return filteredOrders;
}


// ✅ Fetch Tags
export async function fetchShipstationTags(credentials: ShipstationCredentials) {
  try {
    console.log('🔄 Fetching tags from ShipStation API...');
        
    const data = await makeRequest(credentials, '/accounts/listtags');
    console.log('✅ Received tags from API:', data);

    const tags = data.map((tag: any) => ({
      tagId: tag.tagId || 0,
      name: tag.name || '',
      color: tag.color || '#E5E7EB'
    }));

    try {
      console.log('🔄 Updating local tag database...');
      
      // First get existing tags
      const { data: existingTags } = await supabase
        .from('shipstation_tags')
        .select('tag_id');

      const existingTagIds = new Set(existingTags?.map(t => t.tag_id));
      
      // Split into updates and inserts
      const tagsToUpdate = [];
      const tagsToInsert = [];
      
      for (const tag of tags) {
        if (existingTagIds.has(tag.tagId)) {
          tagsToUpdate.push({
            tag_id: tag.tagId,
            name: tag.name,
            color: tag.color
          });
        } else {
          tagsToInsert.push({
            tag_id: tag.tagId,
            name: tag.name,
            color: tag.color
          });
        }
      }

      // Handle updates first
      if (tagsToUpdate.length > 0) {
        for (const tag of tagsToUpdate) {
          const { error } = await supabase
            .from('shipstation_tags')
            .update({ name: tag.name, color: tag.color })
            .eq('tag_id', tag.tag_id);

          if (error) {
            console.error('Error updating tag:', error);
          }
        }
      }

      // Then handle inserts
      if (tagsToInsert.length > 0) {
        const { error } = await supabase
          .from('shipstation_tags')
          .insert(tagsToInsert);

        if (error) {
          console.error('Error inserting new tags:', error);
        }
      }
      
      console.log('✅ Local tag database updated successfully');
    } catch (error) {
      console.error('Error updating local tags:', error);
      throw error;
    }

     return tags;
  } catch (error) {
    console.error('❌ Error in fetchShipstationTags:', error);
    throw error;
  }
}

// ✅ Remove Tag from Orders
export async function removeTagFromOrders(
  credentials: ShipstationCredentials,
  orderIds: number[],
  tagId: string | number
) {
  console.log('🔄 Removing tag', tagId, 'from orders:', orderIds);
  const maxRetries = 3;

  for (const orderId of orderIds) {
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        await makeRequest(credentials, '/orders/removetag', {
          method: 'POST',
          body: JSON.stringify({
            orderId: orderId,
            tagId: Number(tagId)
          })
        });

        console.log(`✅ Tag removed successfully from order ${orderId}`);
        break; // Exit retry loop on success
      } catch (error) {
        console.error(`❌ Error on attempt ${attempt} for order ${orderId}:`, error);

        if (attempt < maxRetries) {
          console.log(`🔄 Retrying order ${orderId} in ${attempt * 2} seconds...`);
          await new Promise((res) => setTimeout(res, attempt * 2000)); // Exponential backoff
        } else {
          console.error(`❌ Max retries reached for order ${orderId}. Skipping to next order.`);
          break; // Move to the next order after max retries
        }
      }
      attempt++;
    }
  }

  console.log('✅ Finished processing all selected orders.');
}

// ✅ Add Tag to Orders (Correct Endpoint)
export async function addTagToOrders(
  credentials: ShipstationCredentials,
  orderIds: number[],
  tagId: string | number
) {
  const maxRetries = 3;

  for (const orderId of orderIds) {
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        await makeRequest(credentials, '/orders/addtag', {
          method: 'POST',
          body: JSON.stringify({
            orderId: orderId,
            tagId: Number(tagId)
          })
        });

        console.log(`✅ Tag applied successfully to order ${orderId}`);
        break; // Exit retry loop on success
      } catch (error) {
        console.error(`❌ Error on attempt ${attempt} for order ${orderId}:`, error);

        if (attempt < maxRetries) {
          console.log(`🔄 Retrying order ${orderId} in ${attempt * 2} seconds...`);
          await new Promise((res) => setTimeout(res, attempt * 2000)); // Exponential backoff
        } else {
          console.error(`❌ Max retries reached for order ${orderId}. Skipping to next order.`);
          break; // Move to the next order after max retries
        }
      }
      attempt++;
    }
  }

  console.log('✅ Finished processing all selected orders.');
}