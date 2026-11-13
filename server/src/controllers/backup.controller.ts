import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middlewares/auth.middleware';
import { STORAGE_PATHS } from '../services/storage.service';
import { createZipBackup } from '../utils/dbBackup';

export async function createBackup(_req: AuthRequest, res: Response) {
  try {
    const backup = await createZipBackup();
    return res.json({
      success: true,
      message: 'Backup gerado com sucesso!',
      backup: {
        filename: backup.filename,
        size: backup.size,
        createdAt: backup.createdAt,
      },
    });
  } catch (error) {
    console.error('Erro no controller de backup:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Falha ao criar backup.' });
    }
  }
}

export async function listBackups(_req: AuthRequest, res: Response) {
  if (!fs.existsSync(STORAGE_PATHS.backups)) {
    return res.json({ success: true, backups: [] });
  }

  const files = fs.readdirSync(STORAGE_PATHS.backups);
  const backups = files
    .filter((f) => f.endsWith('.zip'))
    .map((filename) => {
      const filePath = path.join(STORAGE_PATHS.backups, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        size: `${(stat.size / (1024 * 1024)).toFixed(2)} MB`,
        createdAt: stat.birthtime,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return res.json({ success: true, backups });
}

export async function downloadBackup(req: AuthRequest, res: Response) {
  const filename = String(req.params.filename || '');
  const sanitized = path.basename(filename);
  const filePath = path.join(STORAGE_PATHS.backups, sanitized);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Arquivo de backup não encontrado.' });
  }

  return res.download(filePath, sanitized);
}
