import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ArrowUpDown, ArrowUp, ArrowDown, Tag } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import TagManager from '../components/shipstation/TagManager';
import { useShipstationCredentials } from '../hooks/useShipstationCredentials';
import type { DtfPrintItem } from '../types/dtf';
import type { ShipstationOrder } from '../types/shipstation';

type SortField = 'designId' | 'styleColor' | 'size' | 'quantity' | 'originalSku';

export default function DtfPrintList() {
  const location = useLocation();
  const navigate = useNavigate();
  const { credentials } = useShipstationCredentials();
  const { items: rawItems = [], orders = [] } = location.state || {};
  
  // Debug incoming data
console.log('🔍 DtfPrintList Initial Data:', {
  rawItems: rawItems?.length,
  orders: orders?.length,
  orderSample: orders[0],
  rawItemSample: rawItems[0]
});
  
  // Enhance items with their order tags
   // Enhance items with their order tags
  const items = React.useMemo(() => {
    const mappedItems = rawItems.map(item => {
      const matchingOrder = orders.find(o => 
        o.items.some(i => i.sku === item.originalSku)
      );
      
      // Debug each item mapping
      console.log('🏷️ Item Tag Mapping:', {
        sku: item.originalSku,
        foundOrder: !!matchingOrder,
        orderTags: matchingOrder?.tags,
        orderId: matchingOrder?.orderId
      });
      
      return {
        ...item,
        orderId: matchingOrder?.orderId,
        tags: matchingOrder?.tags || []
      };
    });

    // Debug final mapped items
    console.log('📦 Final Mapped Items:', mappedItems.map(item => ({
      sku: item.originalSku,
      orderId: item.orderId,
      hasTags: !!item.tags?.length,
      tagCount: item.tags?.length
    })));

    return mappedItems;
  }, [rawItems, orders]);
  
  // Debug logs
  console.log('🔄 DtfPrintList Component Mount:', {
    hasCredentials: !!credentials,
    itemsCount: items?.length,
    ordersCount: orders?.length,
    credentials,
    items: items.map(i => ({
      sku: i.originalSku,
      orderId: i.orderId,
      tags: i.tags
    }))
  });

  const [sortField, setSortField] = React.useState<SortField>('designId');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'quantity':
          return (a.quantity - b.quantity) * direction;
        default:
          return (a[sortField].localeCompare(b[sortField])) * direction;
      }
    });
  }, [items, sortField, sortDirection]);

  if (!items?.length) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No items to display. Please select orders from Shipstation.</p>
          <button
            onClick={() => navigate('/shipstation')}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/shipstation')}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">DTF Print List</h2>
              {credentials && orders?.length > 0 && (
                <TagManager 
                  credentials={credentials}
                  selectedOrderIds={orders.map(o => o.orderId)}
                  onTagsUpdated={() => {
                    // Refresh orders data
                    navigate('/shipstation');
                  }}
                />
              )}
            </div>
            <div className="text-sm text-gray-500">
              Total Quantity: {items.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print List
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm dtf-print-modal">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('designId')}
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      DESIGN ID
                      {sortField === 'designId' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('styleColor')}
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      STYLE COLOR
                      {sortField === 'styleColor' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('size')}
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      SIZE
                      {sortField === 'size' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('quantity')}
                    className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-center gap-1">
                      QTY
                      {sortField === 'quantity' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('originalSku')}
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      ORIGINAL SKU
                      {sortField === 'originalSku' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    Tags
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-1 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {item.designId}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {item.styleColor}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {item.size}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {item.originalSku}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      {item.orderId}
                    </td>
                    <td className="px-2 py-1">
                      {orders && orders.find(o => o.orderId === item.orderId) && (
                        <div className="space-y-1 max-w-xs">
                          {orders.find(o => o.orderId === item.orderId)?.notes && (
                            <div className="text-xs text-gray-900">
                              <span className="font-medium">Customer:</span>{' '}
                              {orders.find(o => o.orderId === item.orderId)?.notes}
                            </div>
                          )}
                          {orders.find(o => o.orderId === item.orderId)?.internalNotes && (
                            <div className="text-xs text-indigo-600">
                              <span className="font-medium">Internal:</span>{' '}
                              {orders.find(o => o.orderId === item.orderId)?.internalNotes}
                            </div>
                          )}
                        </div>
                      )}
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
    </DashboardLayout>
  );
}