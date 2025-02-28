import type { DesignFile } from '../types/database';

export type ImportProgress = {
  sku: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  title: string;
  message?: string;
  needsPrintFile?: boolean;
  waitingForUpload?: boolean;
  progress: {
    step: 'metadata' | 'print-file' | 'mockups' | 'keywords';
    completed: boolean;
    details?: {
      dimensions?: string;
      size?: string;
      id?: string;
      url?: string;
      thumbUrl?: string;
      count?: number;
      waitingForUpload?: boolean;
    };
  }[];
};

export type DesignData = {
  title: string;
  keywords: string;
  'id-number'?: string;
  'created_at'?: string;
  'sku'?: string;
  'print_file'?: string;
  'Download File'?: string;
  mockup1?: string;
  mockup2?: string;
  mockup3?: string;
  mockup4?: string;
  mockup5?: string;
  mockup6?: string;
  mockup7?: string;
  mockup8?: string;
  mockup9?: string;
  mockup10?: string;
};