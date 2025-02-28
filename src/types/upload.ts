export type BulkUploadItem = {
  file: File;
  title: string;
  sku: string;
  baseTitle?: string; // Store the original title
};

export type UploadItem = {
  file: File;
  title: string;
  keywords: string[];
  backgroundColor: 'white' | 'black';
  preview: string;
  processing: boolean;
  sku: string;
  progress?: {
    step: 'analyzing' | 'uploading' | 'saving';
    message: string;
  };
  error?: string;
  result?: {
    title: string;
    description: string;
    keywords: string[];
  };
};

export type Options = {
  options: {
    backgroundColor: 'white' | 'black';
    selectedCategories: string[];
    keywords: string[];
    description?: string;
    mockupFiles?: File[];
  }
};