import React, { useState, useMemo } from 'react';
import { X, Trash2, ArrowUpDown, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ShipstationOrder } from '../../types/shipstation';
import type { DtfPrintItem } from '../../types/dtf';
import { parseSku } from '../../utils/skuParser';
import TagManager from './TagManager';
import toast from 'react-hot-toast';

type DtfPrintModalProps = {
  orders?: ShipstationOrder[];
  printList?: DtfPrintItem[];
  onClose: () => void;
  readOnly?: boolean;
  credentials?: ShipstationCredentials;
  onOrdersUpdated?: () => void;
};

export default function DtfPrintModal({ 
  orders, 
  printList, 
  onClose, 
  readOnly = false,
  credentials,
  onOrdersUpdated
}: DtfPrintModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof DtfPrintItem>('designId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [items, setItems] = useState<DtfPrintItem[]>(() => {
    if (printList) return printList;
    
    const parsedItems: DtfPrintItem[] = [];
    const errors: string[] = [];
    
    // Group items by unique SKU (not just design ID)
    const skuGroups = new Map<string, DtfPrintItem>();

    orders?.forEach(order => {
      order.items.forEach(item => {
        // Only parse SKUs that match our DTF format
        if (item.sku.includes('_')) {
          const result = parseSku(item.sku, item.quantity);
          if (result.valid && result.item) {
            // Use full SKU as key to maintain size/style variations
            const key = item.sku;
            const existingItem = skuGroups.get(key);
            
            if (existingItem) {
              // Add quantity to existing SKU
              existingItem.quantity += result.item.quantity;
            } else {
              // Create new entry for this SKU
              skuGroups.set(key, result.item);
            }
          } else if (result.error) {
            errors.push(result.error);
          }
        }
      });
    });

    // Convert grouped SKUs back to array
    parsedItems.push(...skuGroups.values());

    if (errors.length > 0) {
      console.warn('Some SKUs could not be parsed:', errors);
    }

    return parsedItems;
  });

  const totalQuantity = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0), 
    [items]
  );

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aValue.localeCompare(bValue) * direction;
    });
  }, [items, sortField, sortDirection]);

  const handleSort = (field: keyof DtfPrintItem) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePrint = async () => {
    if (!user || !orders) return;
    
    if (items.length === 0) {
      toast.error('No items to print');
      return;
    }

    setLoading(true);
    try {
      // Add a small delay to ensure styles are applied
      setTimeout(() => window.print(), 100);
    } catch (error) {
      console.error('Error printing list:', error);
      toast.error('Failed to print list');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (index: number) => {
    if (readOnly) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col dtf-print-modal"
        data-print-date={new Date().toLocaleString()}
      >
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0 no-print">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-gray-900">DTF Print List</h2>
            <div className="text-sm text-gray-600">
              Total Quantity: {totalQuantity}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          <div className="mb-4 flex justify-between items-center no-print">
            <div className="text-sm text-gray-600">
              {sortedItems.length} items
            </div>
            <div className="flex items-center gap-4">
              {!readOnly && credentials && orders && (
                <TagManager 
                  credentials={credentials}
                  selectedOrderIds={orders.map(o => o.orderId)}
                  onTagsUpdated={onOrdersUpdated}
                />
              )}
              {!readOnly && (
                <button
                  onClick={handlePrint}
                  disabled={loading || sortedItems.length === 0}
                  className="flex items-center px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Print List
                </button>
              )}
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {(['designId', 'styleColor', 'size'] as const).map(field => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)} 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                        <ArrowUpDown className="w-4 h-4 no-print" />
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original SKU
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  {!readOnly && (
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider no-print">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 relative">
                {sortedItems.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 ${
                      item.designId === 'BadSKU' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">
                      <span className={item.designId === 'BadSKU' ? 'text-red-600 font-medium' : ''}>
                        {item.designId}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">
                      <span className={item.styleColor === 'BadSKU' ? 'text-red-600 font-medium' : ''}>
                        {item.styleColor}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">
                      <span className={item.size === 'BadSKU' ? 'text-red-600 font-medium' : ''}>
                        {item.size}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-500">
                      <span className={item.designId === 'BadSKU' ? 'text-red-600 font-medium' : ''}>
                        {item.originalSku}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm">
                      {orders && orders.find(o => 
                        o.items.some(i => i.sku === item.originalSku)
                      )?.tags?.map((tag) => (
                        <span
                          key={`${item.originalSku}-${tag.tagId}`}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-1"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            border: `1px solid ${tag.color}40`
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}