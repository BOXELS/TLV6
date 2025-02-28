import React from 'react';
import { Package, Tags, Hash } from 'lucide-react';
import type { ShipstationOrder } from '../../types/shipstation';

type OrderStatsProps = {
  orders: ShipstationOrder[];
};

export default function OrderStats({ orders }: OrderStatsProps) {
  const totalOrders = orders.length;
  const totalSkus = orders.reduce((sum, order) => 
    sum + order.items.length, 0
  );
  const totalQuantity = orders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  return (
    <div className="flex items-center gap-6 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <Package className="w-4 h-4" />
        <span>{totalOrders} orders to process</span>
      </div>
      <div className="flex items-center gap-1">
        <Tags className="w-4 h-4" />
        <span>{totalSkus} SKUs</span>
      </div>
      <div className="flex items-center gap-1">
        <Hash className="w-4 h-4" />
        <span>{totalQuantity} items</span>
      </div>
    </div>
  );
}