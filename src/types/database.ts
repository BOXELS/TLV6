export type Category = {
  id: string;
  name: string;
  created_at: string;
  category_keyword_links?: { 
    keywords?: { 
      keyword: string 
    } 
  }[];
};

export type DesignKeyword = {
  keyword: string;
};

export type DesignFile = {
  id: string;
  sku: string;
  title: string;
  uploaded_by: string;
  print_file_url: string;
  web_file_url: string;
  created_at: string;
  updated_at: string;
  jane_designs_listed?: {
    id: string;
    status: 'active' | 'inactive';
  }[];
  design_keyword_links?: {
    keywords?: {
      keyword: string;
    }
  }[];
  categories?: {
    category_id: string;
    name: string;
  }[];
  mockups?: DesignMockup[];
};

export type DesignCategory = {
  design_id: string;
  category_id: string;
};

export type DesignMockup = {
  id: string;
  design_id: string;
  url: string;
  thumb_url: string;
  created_at: string;
  sort_order: number;
  is_main: boolean;
};

export type Keyword = {
  id: string;
  keyword: string;
  created_at: string;
  usage_count?: number;
};