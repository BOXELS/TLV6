import Papa from 'papaparse';
import { ImportProgress } from './csvImport';

export function generateFailedImportsCsv(failedImports: ImportProgress[]): string {
  // Extract all possible columns from the failed imports
  const allColumns = new Set<string>();
  failedImports.forEach(item => {
    Object.keys(item).forEach(key => allColumns.add(key));
    // Add progress details as columns
    item.progress?.forEach(p => {
      if (p.details) {
        Object.keys(p.details).forEach(key => 
          allColumns.add(`${p.step}_${key}`)
        );
      }
    });
  });

  // Transform data for CSV
  const data = failedImports.map(item => {
    const row: Record<string, any> = {
      sku: item.sku,
      title: item.title,
      status: item.status,
      error_message: item.message || '',
      needs_print_file: item.needsPrintFile ? 'Yes' : 'No'
    };

    // Add progress details
    item.progress?.forEach(p => {
      row[`${p.step}_completed`] = p.completed ? 'Yes' : 'No';
      if (p.details) {
        Object.entries(p.details).forEach(([key, value]) => {
          row[`${p.step}_${key}`] = value;
        });
      }
    });

    return row;
  });

  return Papa.unparse(data);
}