import { mkdir, copyFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function createBackup() {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const backupDir = join(__dirname, '..', 'backups', `backup_${timestamp}`);

  try {
    // Create backup directory
    await mkdir(backupDir, { recursive: true });

    // Directories to backup
    const dirsToBackup = [
      'src',
      'public',
      'supabase',
    ];

    // Files to backup
    const filesToBackup = [
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
    ];

    // Backup directories
    for (const dir of dirsToBackup) {
      const srcDir = join(__dirname, '..', dir);
      const destDir = join(backupDir, dir);
      
      try {
        await mkdir(destDir, { recursive: true });
        const files = await readdir(srcDir, { recursive: true });
        
        for (const file of files) {
          const srcPath = join(srcDir, file);
          const destPath = join(destDir, file);
          await mkdir(dirname(destPath), { recursive: true });
          await copyFile(srcPath, destPath);
        }
      } catch (error) {
        console.warn(`Warning: Could not backup directory ${dir}:`, error.message);
      }
    }

    // Backup individual files
    for (const file of filesToBackup) {
      try {
        await copyFile(
          join(__dirname, '..', file),
          join(backupDir, file)
        );
      } catch (error) {
        console.warn(`Warning: Could not backup file ${file}:`, error.message);
      }
    }

    console.log(`Backup created successfully at ${backupDir}`);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

createBackup();