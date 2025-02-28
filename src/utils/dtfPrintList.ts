import { supabase } from '../lib/supabase';
import { addTagToOrders } from './shipstationApi';
import type { DtfPrintItem, DtfPrintList } from '../types/dtf';
import type { ShipstationOrder, ShipstationCredentials } from '../types/shipstation';

export async function saveDtfPrintList(
  items: DtfPrintItem[],
  orders: ShipstationOrder[],
  userId: string,
  credentials?: ShipstationCredentials
): Promise<string> {
  if (!items.length) {
    throw new Error('No items provided for print list');
  }

  if (!orders.length) {
    throw new Error('No orders provided for print list');
  }

  // First try to add tags if credentials are provided
  if (credentials) {
    try {
      await addTagToOrders(
        credentials,
        orders.map(order => order.orderId),
        'Data Exported'
      );
    } catch (error) {
      console.error('Error adding tags to orders:', error);
      throw new Error('Failed to tag orders as exported');
    }
  }

  // First save the print list
  const { data, error } = await supabase
    .from('dtf_print_lists')
    .insert({
      created_by: userId,
      items: items,
      total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      order_ids: orders.map(order => order.orderId)
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving print list:', error);
    throw new Error('Failed to save print list to database');
  }

  return data.id;
}

export async function getDtfPrintLists(userId: string): Promise<DtfPrintList[]> {
  const { data, error } = await supabase
    .from('dtf_print_lists')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDtfPrintList(id: string): Promise<DtfPrintList> {
  const { data, error } = await supabase
    .from('dtf_print_lists')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function viewDtfPrintList(id: string): Promise<DtfPrintList> {
  const { data, error } = await supabase
    .from('dtf_print_lists')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}