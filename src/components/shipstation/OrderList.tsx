import React from 'react';
import { Package, Gift, Tag, ArrowUpDown } from 'lucide-react';
import type { ShipstationOrder, ShipstationCredentials } from '../../types/shipstation';
import OrderToolbar from './OrderToolbar';
import TagManager from './TagManager';
import { supabase } from '../../lib/supabase';

type SortField = 'orderNumber' | 'customerName' | 'orderDate' | 'orderTotal' | 'quantity' | 'tags';

type SortableColumn = {
  key: string;
  label: string;
};

const SORTABLE_COLUMNS: SortableColumn[] = [
  { key: 'orderNumber', label: 'ORDER #' },
  { key: 'customerName', label: 'CUSTOMER' },
  { key: 'orderDate', label: 'ORDER DATE' },
  { key: 'preview', label: 'PREVIEW' },
  { key: 'items', label: 'ITEM SKU' },
  { key: 'items', label: 'ITEM NAME' },
  { key: 'quantity', label: 'QTY' },
  { key: 'orderTotal', label: 'ORDER TOTAL' },
  { key: 'tags', label: 'TAGS' }
];

type OrderListProps = {
  orders: ShipstationOrder[];
  loading: boolean;
  credentials: ShipstationCredentials;
  onOrdersUpdated: () => void;
};

export default function OrderList({ orders, loading, credentials, onOrdersUpdated }: OrderListProps) {
  // Helper function to extract numeric prefix
const extractNumericPrefix = (sku: string): string | null => {
  // Handle both hyphen and underscore separated SKUs
  const parts = sku.split(/[-_]/);
  return parts[0].match(/^\d+/) ? parts[0] : null;
};


  
  console.log('🛠️ Orders passed to OrderList:', orders);
  console.log('🛠️ First Order Tags:', orders[0]?.tags);
  console.log('🔍 Orders with Tags:', orders.map(order => ({
    orderNumber: order.orderNumber,
    tags: order.tags
  })));
  console.log('📊 Sample Order Structure:', orders[0]);

  const [selectedOrders, setSelectedOrders] = React.useState<ShipstationOrder[]>([]);
  const [sortField, setSortField] = React.useState<SortField>('orderDate');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [tagFilter, setTagFilter] = React.useState<'all' | 'none' | string[]>('all');
  const [filterMode, setFilterMode] = React.useState<'has' | 'not'>('has');
  const [tagData, setTagData] = React.useState<Record<string, { name: string; color: string }>>({});
  const [showTagDropdown, setShowTagDropdown] = React.useState(false);
  const [selectAll, setSelectAll] = React.useState(false);
  const [designUrls, setDesignUrls] = React.useState<Record<string, string>>({});
  const tagFilterRef = React.useRef<HTMLDivElement>(null);

  // Load design URLs when orders change
  React.useEffect(() => {
    const loadDesignUrls = async () => {
      const newUrls: Record<string, string> = {};
      const processedSkus = new Set<string>();
      const failedSkus = new Set<string>();
      
      for (const order of orders) {
        for (const item of order.items) {
          // Extract numeric prefix
          const numericPrefix = extractNumericPrefix(item.sku);
          if (!numericPrefix) {
            console.warn('⚠️ No numeric prefix found for SKU:', item.sku);
            continue;
          }
          
          // Skip if we've already processed or failed this prefix
          if (processedSkus.has(numericPrefix) || failedSkus.has(numericPrefix)) continue;
          processedSkus.add(numericPrefix);
          
          console.log('🔍 Looking up design for numeric prefix:', numericPrefix);
          
          try {
            const { data: design } = await supabase
  .from('design_files')
  .select('web_file_url, sku')
  .or(`sku.ilike.${numericPrefix}-%,sku.ilike.${numericPrefix}_%,sku.eq.${numericPrefix}`)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

              
            if (design?.web_file_url) {
              console.log('✅ Found design:', {
                prefix: numericPrefix,
                matchedSku: design.sku,
                url: design.web_file_url
              });
              newUrls[numericPrefix] = design.web_file_url;
            } else {
              console.log('⚠️ No design found for prefix:', numericPrefix, 'Original SKU:', item.sku);
              failedSkus.add(numericPrefix);
            }
          } catch (error) {
            if (error instanceof Error) {
              console.error('❌ Error looking up design for prefix:', numericPrefix, {
                message: error.message,
                originalSku: item.sku
              });
            } else {
              console.error('❌ Unknown error for prefix:', numericPrefix, error);
            }
            failedSkus.add(numericPrefix);
          }
        }
      }
      
      console.log('📊 SKU Matching Results:', {
        loaded: Object.keys(newUrls).length,
        failed: {
          count: failedSkus.size,
          skus: Array.from(failedSkus)
        },
        success_rate: `${Math.round((Object.keys(newUrls).length / processedSkus.size) * 100)}%`,
        total: processedSkus.size
      });
      setDesignUrls(newUrls);
    };
    
    loadDesignUrls();
  }, [orders]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagFilterRef.current && !tagFilterRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tag data when component mounts
  React.useEffect(() => {
    const loadTagData = async () => {
      try {
        const { data: tags, error } = await supabase
          .from('shipstation_tags')
          .select('tag_id, name, color');

        if (error) throw error;

        const tagMap = (tags || []).reduce((acc, tag) => ({
          ...acc,
          [tag.tag_id.toString()]: { name: tag.name, color: tag.color }
        }), {});

        setTagData(tagMap);
      } catch (error) {
        console.error('Error loading tag data:', error);
      }
    };
    loadTagData();
  }, []);
  
  // Get unique tags from all orders
  const availableTags = React.useMemo(() => {
    const tagMap = new Map<string, { name: string; color: string }>();
    orders.forEach(order => {
      order.tags?.forEach(tag => {
        const tagIdStr = tag.tagId.toString();
        if (!tagMap.has(tagIdStr)) {
          const tagInfo = tagData[tagIdStr] || { name: 'Unknown', color: '#6B7280' };
          tagMap.set(tagIdStr, tagInfo);
        }
      });
    });
    return Array.from(tagMap.entries()).map(([id, tag]) => ({
      id,
      name: tag.name,
      color: tag.color
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const handleSelectOrder = (order: ShipstationOrder, checked: boolean) => {
    setSelectedOrders(prev => 
      checked 
        ? [...prev, order]
        : prev.filter(o => o.orderId !== order.orderId)
    );
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter orders based on selected tags
  const filteredOrders = React.useMemo(() => {
    if (tagFilter === 'all') return orders;
    if (tagFilter === 'none') return orders.filter(order => !order.tags?.length);
    if (Array.isArray(tagFilter)) {
      return orders.filter(order => {
        if (!order.tags?.length) return filterMode === 'not';
        if (filterMode === 'has') {
          return tagFilter.every(tagIdStr =>
            order.tags.some(orderTag => orderTag.tagId.toString() === tagIdStr)
          );
        } else {
          // 'not' mode - return orders that don't have ANY of the selected tags
          return !tagFilter.some(tagIdStr =>
            order.tags.some(orderTag => orderTag.tagId.toString() === tagIdStr)
          );
        }
      });
    }
    return orders;
  }, [orders, tagFilter, filterMode]);

  const sortedOrders = React.useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'orderNumber':
          return a.orderNumber.localeCompare(b.orderNumber) * direction;
        case 'customerName':
          return a.customerName.localeCompare(b.customerName) * direction;
        case 'orderDate':
          return (new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()) * direction;
        case 'orderTotal':
          return (a.orderTotal - b.orderTotal) * direction;
        case 'quantity':
          const aQty = a.items.reduce((sum, item) => sum + item.quantity, 0);
          const bQty = b.items.reduce((sum, item) => sum + item.quantity, 0);
          return (aQty - bQty) * direction;
        case 'tags':
          const aTags = a.tags?.map(t => t.name).join(',') || '';
          const bTags = b.tags?.map(t => t.name).join(',') || '';
          return aTags.localeCompare(bTags) * direction;
        default:
          return 0;
      }
    });
  }, [filteredOrders, sortField, sortDirection]);

  // Handle select all after sortedOrders is defined
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedOrders(checked ? sortedOrders : []);
  };

  // Calculate checkbox state
  const allSelected = sortedOrders.length > 0 && selectedOrders.length === sortedOrders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < sortedOrders.length;

  // Reset selection when filter changes
  React.useEffect(() => {
    if (selectAll) {
      setSelectedOrders(sortedOrders);
    } else {
      setSelectedOrders([]);
    }
  }, [sortedOrders, selectAll]);

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  if (!orders.length) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
        <p className="mt-1 text-sm text-gray-500">No open orders found in Shipstation</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <OrderToolbar 
            selectedOrders={selectedOrders}
            filteredOrders={sortedOrders}
          />
          {availableTags.length > 0 && (
            <div className="relative" ref={tagFilterRef}>
              <select 
                value={Array.isArray(tagFilter) ? 'custom' : tagFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all' || value === 'none') {
                    setTagFilter(value);
                    setShowTagDropdown(false);
                  } else if (value === 'custom') {
                    setShowTagDropdown(true);
                  }
                }}
                className="w-48 pl-8 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Tags</option>
                <option value="none">No Tags</option>
                <option value="custom">Filter by Tags...</option>
              </select>
              <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              
              {showTagDropdown && (
                <div className="absolute z-50 left-full top-0 ml-2 bg-white rounded-md shadow-lg border border-gray-200 min-w-[250px]">
                  <div className="p-2 border-b">
                    <div className="flex rounded-md shadow-sm">
                      <button
                        onClick={() => setFilterMode('has')}
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-l-md border ${
                          filterMode === 'has'
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Has Tags
                      </button>
                      <button
                        onClick={() => setFilterMode('not')}
                        className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-r-md border-t border-r border-b -ml-px ${
                          filterMode === 'not'
                            ? 'bg-red-50 text-red-600 border-red-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Does Not Have
                      </button>
                    </div>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {availableTags.map(tag => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Array.isArray(tagFilter) && tagFilter.includes(tag.id)}
                          onChange={(e) => {
                            if (!Array.isArray(tagFilter)) {
                              setTagFilter([tag.id]);
                              return;
                            }
                            const newTags = e.target.checked
                              ? [...tagFilter, tag.id]
                              : tagFilter.filter(id => id !== tag.id);
                            setTagFilter(newTags);
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span 
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-gray-700">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="border-t p-2 bg-gray-50 flex justify-between">
                    <button
                      onClick={() => {
                        setTagFilter('all');
                        setShowTagDropdown(false);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Reset Filter
                    </button>
                    <button
                      onClick={() => setShowTagDropdown(false)}
                      className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <TagManager 
            credentials={credentials}
            selectedOrderIds={selectedOrders.map(o => o.orderId)}
            onTagsUpdated={onOrdersUpdated}
          />
        </div>
      </div>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th 
                onClick={() => handleSort('orderNumber')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Order #
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'orderNumber' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
              </th>
              <th 
                onClick={() => handleSort('customerName')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Customer
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'customerName' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
              </th>
              <th 
                onClick={() => handleSort('orderDate')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Order Date
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'orderDate' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item SKU
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Name
              </th>
              <th 
                onClick={() => handleSort('quantity')}
                className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-center gap-1">
                  Qty
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'quantity' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
              </th>
              <th 
                onClick={() => handleSort('orderTotal')}
                className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-end gap-1">
                  Order Total
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'orderTotal' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
              </th>
              <th 
                onClick={() => handleSort('tags')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Tags
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'tags' ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
           {sortedOrders.map((order) => {
  console.log(`🔍 Order ${order.orderNumber} Tags:`, order.tags);

  return (
    <tr key={order.orderId} className="hover:bg-gray-50">
      <td className="px-3 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedOrders.some(o => o.orderId === order.orderId)}
          onChange={(e) => handleSelectOrder(order, e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.orderNumber}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.customerName}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(order.orderDate).toLocaleDateString()}
      </td>
      <td className="px-3 py-4">
        <div className="flex flex-wrap gap-2">
          {order.items.map((item, idx) => {
            const numericPrefix = extractNumericPrefix(item.sku);
            if (!numericPrefix) return null;
            
            const designUrl = designUrls[numericPrefix];
            
            if (!designUrl) return null;
            
            return (
              <div key={`${order.orderId}-${idx}`} className="relative group/preview">
                {/* Thumbnail */}
                <div className="relative group">
                  <img
                    src={designUrl}
                    alt={item.name}
                    className="w-12 h-12 object-contain bg-white border rounded"
                    loading="lazy"
                    onError={(e) => console.error('❌ Image load error:', designUrl)}
                    onLoad={() => console.log('✅ Image loaded:', designUrl)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-xs text-white font-medium px-1">{numericPrefix}</span>
                  </div>
                </div>
                
                {/* Hover Preview */}
                <div className="absolute left-0 top-0 z-50 opacity-0 invisible group-hover/preview:opacity-100 group-hover/preview:visible transition-all duration-200 pointer-events-none">
                  <div className="relative">
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <img
                      src={designUrl}
                      alt={`${item.name} (preview)`}
                      className="w-[250px] h-[250px] object-contain bg-white rounded-lg shadow-xl border"
                      style={{ maxHeight: '80vh', maxWidth: '80vw' }}
                    />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-900">
        <div className="max-h-24 overflow-y-auto space-y-1">
          {order.items.map((item, idx) => (
            <div key={`${order.orderId}-${idx}`} className="text-xs bg-gray-50 px-2 py-1 rounded">
              {item.sku}
            </div>
          ))}
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-900 max-w-md">
        <div className="max-h-24 overflow-y-auto space-y-1">
          {order.items.map((item, idx) => (
            <div key={`${order.orderId}-${idx}`} className="text-xs">
              {item.name.length > 40 ? `${item.name.slice(0, 40)}...` : item.name}
            </div>
          ))}
        </div>
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-900">
        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-900">
        ${(order.orderTotal || 0).toFixed(2)}
      </td>
      <td className="px-3 py-4 whitespace-nowrap text-sm" onClick={() => handleSort('tags')}>
  {Array.isArray(order.tags) && order.tags.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {order.tags.map((tag, idx) => {
        const tagInfo = tagData[tag.tagId];
        return (
          <span
            key={`${order.orderId}-${tag.tagId}-${idx}`}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${tagInfo?.color || '#6B7280'}20`,
              color: tagInfo?.color || '#6B7280',
              border: `1px solid ${tagInfo?.color || '#6B7280'}40`
            }}
          >
            {tagInfo?.name || 'Unknown'}
          </span>
        );
      })}
    </div>
  ) : (
    <span className="text-gray-400 text-xs">No Tags</span>
  )}
</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.notes && (
                    <div className="max-w-xs truncate" title={order.notes}>
                      <span className="font-medium">Customer:</span> {order.notes}
                    </div>
                  )}
                  {order.internalNotes && (
                    <div className="max-w-xs truncate text-indigo-600" title={order.internalNotes}>
                      <span className="font-medium">Internal:</span> {order.internalNotes}
                    </div>
                  )}
                </td>
    </tr>
  );
})}

          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}