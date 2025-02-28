import { contextBridge } from 'electron';
import { readFile, readDir, writeFile, exists } from './utils/fileSystem';

// Expose file system APIs to renderer process
contextBridge.exposeInMainWorld('apis', {
  readFile,
  readDir,
  writeFile,
  exists
});