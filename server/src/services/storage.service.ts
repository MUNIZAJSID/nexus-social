import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env';

function getStorageRoot(): string {
  if (process.env.STORAGE_DIR && path.isAbsolute(process.env.STORAGE_DIR)) {
    return process.env.STORAGE_DIR;
  }
  const candidates = [
    path.resolve(__dirname, '../../../storage'),
    path.resolve(process.cwd(), 'storage'),
    path.resolve(process.cwd(), '../storage'),
    path.resolve(__dirname, '../../storage'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return candidates[0];
}

function getBackupsRoot(): string {
  const candidates = [
    path.resolve(__dirname, '../../../backups'),
    path.resolve(process.cwd(), 'backups'),
    path.resolve(process.cwd(), '../backups'),
    path.resolve(__dirname, '../../backups'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return candidates[0];
}

const storageRoot = getStorageRoot();
const backupsRoot = getBackupsRoot();

export const STORAGE_PATHS = {
  root: storageRoot,
  avatars: path.join(storageRoot, 'avatars'),
  posts: path.join(storageRoot, 'posts'),
  videos: path.join(storageRoot, 'videos'),
  chat: path.join(storageRoot, 'chat'),
  backups: backupsRoot,
};

/**
 * Garante que todas as pastas de armazenamento local existam
 */
export function ensureStorageDirectoriesExist() {
  Object.values(STORAGE_PATHS).forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

/**
 * Calcula o tamanho total utilizado pelo armazenamento local em Bytes
 */
export function calculateDirectorySize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let totalSize = 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      totalSize += calculateDirectorySize(fullPath);
    } else if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      totalSize += stats.size;
    }
  }

  return totalSize;
}

/**
 * Retorna o tamanho formatado em MB/GB
 */
export function getStorageStats() {
  const bytes = calculateDirectorySize(STORAGE_PATHS.root);
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  const gb = (bytes / (1024 * 1024 * 1024)).toFixed(2);

  return {
    bytes,
    mb: `${mb} MB`,
    gb: `${gb} GB`,
  };
}

/**
 * Remove um arquivo de storage com segurança
 */
export function deleteStorageFile(relativePath: string) {
  try {
    // relativePath format: /storage/posts/filename.jpg
    const cleaned = relativePath.replace(/^\/storage\//, '');
    const fullPath = path.join(STORAGE_PATHS.root, cleaned);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error(`Erro ao deletar arquivo ${relativePath}:`, err);
  }
}
