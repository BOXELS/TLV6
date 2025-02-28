import React from 'react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ShipstationOrder } from '../../types/shipstation';
import { parseDtfItems } from '../../utils/printWindow';

type OrderToolbarProps = {
  selectedOrders: ShipstationOrder[];
  filteredOrders: ShipstationOrder[];
};

export default function OrderToolbar({ selectedOrders, filteredOrders }: OrderToolbarProps) {
  const navigate = useNavigate();
  const ordersToUse = selectedOrders.length > 0 ? selectedOrders : filteredOrders;

  const handlePrintList = () => {
    const items = parseDtfItems(ordersToUse);
    navigate('/shipstation/print-list', { 
      state: { 
        items,
        orders: ordersToUse // Pass the full orders array
      } 
    });
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrintList}
          disabled={ordersToUse.length === 0}
          className="flex items-center px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          <FileText className="w-4 h-4 mr-2" />
          DTF Print List
          {ordersToUse.length > 0 && ` (${ordersToUse.length})`}
        </button>
      </div>

      {selectedOrders.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedOrders.length} orders selected
        </div>
      )}

    </div>
  );
}