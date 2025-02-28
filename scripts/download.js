import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function createBackup() {
  try {
    // First run backup script
    const backupScript = await import('./backup.js');
    await backupScript.default();

    // Get paths
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const backupDir = join(__dirname, '..', 'backups', `backup_${timestamp}`);
    const zipFile = join(__dirname, '..', 'backups', `backup_${timestamp}.zip`);

    // Create zip file
    const output = createWriteStream(zipFile);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add the backup directory to the archive, preserving directory structure
    archive.directory(backupDir, false);

    // Listen for all archive data to be written
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    console.log(`Backup zip created at: ${zipFile}`);
    return zipFile;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

// If running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup().catch(error => {
    console.error('Backup failed:', error);
    process.exit(1);
  });
}

export default createBackup;