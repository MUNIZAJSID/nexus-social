import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { AuthRequest } from '../middlewares/auth.middleware';
import { STORAGE_PATHS } from '../services/storage.service';

export async function createBackup(_req: AuthRequest, res: Response) {
  try {
    if (!fs.existsSync(STORAGE_PATHS.backups)) {
      fs.mkdirSync(STORAGE_PATHS.backups, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const backupFileName = `localsocial_backup_${timestamp}.zip`;
    const backupFilePath = path.join(STORAGE_PATHS.backups, backupFileName);

    const output = fs.createWriteStream(backupFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const stats = fs.statSync(backupFilePath);
      return res.json({
        success: true,
        message: 'Backup gerado com sucesso!',
        backup: {
          filename: backupFileName,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          createdAt: new Date(),
        },
      });
    });

    archive.on('error', (err) => {
      console.error('Erro ao gerar backup ZIP:', err);
      return res.status(500).json({ success: false, message: 'Erro ao gerar arquivo de backup.' });
    });

    archive.pipe(output);

    const dbPaths = [
      path.resolve(process.cwd(), 'localsocial.db'),
      path.resolve(process.cwd(), 'server/localsocial.db'),
      path.resolve(process.cwd(), 'server/prisma/localsocial.db'),
    ];

    for (const dbp of dbPaths) {
      if (fs.existsSync(dbp)) {
        archive.file(dbp, { name: 'database/localsocial.db' });
        break;
      }
    }

    if (fs.existsSync(STORAGE_PATHS.root)) {
      archive.directory(STORAGE_PATHS.root, 'storage');
    }

    await archive.finalize();
  } catch (error) {
    console.error('Erro no controller de backup:', error);
    return res.status(500).json({ success: false, message: 'Falha ao criar backup.' });
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
