export type ShipstationOrder = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  items: { sku: string; name: string; quantity: number }[];
  orderTotal: number;
  tags: { tagId: number; name: string; color: string }[];
  notes?: string;
  internalNotes?: string;
};


export type ShipstationOrder = {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  customerName: string;
  customerEmail: string;
  orderTotal: number;
  items: ShipstationOrderItem[];
  tags: Array<{
    tagId: number;
    name: string;
    color: string;
  }>;
  notes?: string;
  gift?: boolean;
  shippingPaid: number;
  amountPaid: number;
};

export type ShipstationCredentials = {
  apiKey: string;
  apiSecret: string;
};

export type ShipstationTag = {
  tagId: number;
  name: string;
  color: string;
};