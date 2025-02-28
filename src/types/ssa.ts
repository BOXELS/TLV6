export type SsaCredentials = {
  accountId: string;
  apiKey: string;
};

export type SsaProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  color: string;
  size: string;
  price: number;
  inventory: {
    quantity: number;
    warehouse: string;
  }[];
};

export type SsaOrder = {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  items: SsaProduct[];
  total: number;
};