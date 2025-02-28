import { DesignFile } from '../types/database';

export function generateDesignCsv(designs: DesignFile[]): string {
  // CSV headers
  const headers = [
    'Thumbnail',
    'Title',
    'SKU',
    'Categories',
    'Keywords',
    'Print File URL',
    'Web File URL',
    'Mockup URLs',
    'Mockup Thumbnail URLs',
    'Created At'
  ];

  // Convert designs to CSV rows
  const rows = designs.map(design => [
    // Add IMAGE formula without any single quotes
    `=IMAGE("${design.web_file_url.replace(/"/g, '""')}")`,
    design.title,
    design.sku,
    design.categories?.map(c => c.name).join(', ') || '',
    design.keywords?.map(k => k.keyword).join(', ') || '',
    design.print_file_url,
    design.web_file_url,
    design.mockups?.map(m => m.url).join('|') || '',
    design.mockups?.map(m => m.thumb_url).join('|') || '',
    new Date(design.created_at).toLocaleDateString()
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        // Escape cells that contain commas or quotes
        cell.includes(',') || cell.includes('"') 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    )
  ].join('\n');

  return csvContent;
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}