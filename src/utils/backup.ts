import { supabase } from '../lib/supabase'; 
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import { useAdmin } from '../hooks/useAdmin';

const TABLES = [
  'design_files',
  'categories', 
  'keywords',
  'design_categories',
  'design_keyword_links',
  'category_keyword_links'
];

const PROJECT_STRUCTURE = {
  root: [
    'package.json',
    'tsconfig.json',
    'tsconfig.app.json', 
    'tsconfig.node.json',
    'vite.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'index.html',
    '.env',
    'VERSION'
  ],
  src: [
    'App.tsx',
    'main.tsx',
    'index.css',
    'vite-env.d.ts',
    'components/**/*',
    'context/**/*',
    'hooks/**/*',
    'lib/**/*',
    'pages/**/*',
    'types/**/*',
    'utils/**/*'
  ],
  scripts: [
    'backup.js',
    'download.js'
  ]
};

async function fetchFileContent(path: string): Promise<string | null> { 
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return response.text();
  } catch (error) {
    console.warn(`Failed to fetch ${path}:`, error);
    return null;
  }
}

async function addFilesToZip(zip: JSZip, basePath: string, files: string[]) {
  for (const file of files) {
    try {
      const content = await fetchFileContent(`${basePath}/${file}`);
      if (content) zip.file(file, content);
    } catch (error) {
      console.warn(`Failed to add file ${file}:`, error);
    }
  }
}

export async function createBackup(): Promise<{ url: string; filename: string }> {
  try {
    console.log('🚀 Starting backup process...');
    
    // Verify admin access first
    const { data: roleCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', supabase.auth.user()?.id)
      .single();

    if (!roleCheck || roleCheck.role !== 'admin') {
      throw new Error('Only administrators can create backups');
    }
    
    // First check if bucket exists and user has access
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      console.error('Error checking buckets:', bucketError);
      throw new Error('Failed to access storage');
    }

    const backupBucket = buckets?.find(b => b.id === 'backups');
    if (!backupBucket) {
      throw new Error('Backup storage is not properly configured');
    }

    const zip = new JSZip();

    // 1. Backup database content
    console.log('📦 Backing up database tables...');
    const dataFolder = zip.folder('data');
    if (!dataFolder) throw new Error('Failed to create data folder');

    for (const table of TABLES) {
      console.log(`📄 Fetching data from table: ${table}`);
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`Error fetching data from "${table}":`, error);
        continue;
      }

      if (data && data.length > 0) {
        dataFolder.file(`${table}.json`, JSON.stringify(data, null, 2));
      }
    }

    // 2. Backup project files
    console.log('📂 Backing up project files...');
    
    // Root files
    await addFilesToZip(zip, '', PROJECT_STRUCTURE.root);
    
    // Source files
    const srcFolder = zip.folder('src');
    if (srcFolder) {
      await addFilesToZip(srcFolder, 'src', PROJECT_STRUCTURE.src);
    }
    
    // Scripts
    const scriptsFolder = zip.folder('scripts');
    if (scriptsFolder) {
      await addFilesToZip(scriptsFolder, 'scripts', PROJECT_STRUCTURE.scripts);
    }

    // 3. Add backup metadata
    const timestamp = new Date().toISOString().split('.')[0].replace(/[:]/g, '-');
    const metadata = {
      timestamp,
      version: '1.2.0',
      tables: TABLES,
      fileStructure: PROJECT_STRUCTURE,
      type: 'full-backup'
    };

    zip.file('backup_info.json', JSON.stringify(metadata, null, 2));

    // Generate zip file
    console.log('📦 Generating zip file...');
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // Upload to Supabase Storage
    const filename = `print_files_manager_backup_${timestamp}.zip`;
    const { data, error } = await supabase.storage
      .from('backups')
      .upload(filename, blob, {
        cacheControl: '3600',
        contentType: 'application/zip',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload backup: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('backups')
      .getPublicUrl(filename);

    if (!publicUrl) {
      throw new Error('Failed to generate download URL');
    }
    return {
      url: publicUrl,
      filename
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error creating backup:', error);
    toast.error(`Backup failed: ${message}`);
    throw error;
  }
}