export type DtfPrintItem = {
  designId: string;
  styleColor: string;
  size: string;
  quantity: number;
  originalSku: string;
  orderId?: string;
  tags?: Array<{
    tagId: number;
    name: string;
    color: string;
  }>;
};

export type ParsedSkuResult = {
  valid: boolean;
  item?: DtfPrintItem;
  error?: string;
};

export type DtfPrintList = {
  id: string;
  created_at: string;
  created_by: string;
  items: DtfPrintItem[];
  total_quantity: number;
  order_ids: string[];
};