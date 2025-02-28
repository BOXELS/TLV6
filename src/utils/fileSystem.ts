/**
 * File system utilities for backup/restore operations
 */

export interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

export async function readFile(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to read file: ${path}`);
  }
  return response.text();
}

export async function buildFileTree(basePath: string, entries: FileEntry[]): Promise<FileEntry[]> {
  const tree: FileEntry[] = [];

  for (const entry of entries) {
    const fullPath = `${basePath}/${entry.path}`;
    
    if (entry.isDirectory && entry.children) {
      const children = await buildFileTree(fullPath, entry.children);
      tree.push({
        ...entry,
        children
      });
    } else {
      const content = await readFile(fullPath);
      tree.push({
        ...entry,
        content
      });
    }
  }

  return tree;
}

export function validatePath(path: string): boolean {
  // Basic path validation
  return !path.includes('../') && !path.startsWith('/');
}