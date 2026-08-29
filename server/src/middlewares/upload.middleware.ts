import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { STORAGE_PATHS, ensureStorageDirectoriesExist } from '../services/storage.service';
import { ENV } from '../config/env';

ensureStorageDirectoriesExist();

function createStorage(folderPath: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      cb(null, folderPath);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
}

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}. Formatos permitidos: Fotos, Vídeos e Áudios.`));
  }
}

const limits = {
  fileSize: Math.max(ENV.MAX_UPLOAD_SIZE_MB, 100) * 1024 * 1024, // 100MB
};

export const uploadAvatar = multer({
  storage: createStorage(STORAGE_PATHS.avatars),
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB para avatar
});

export const uploadPostMedia = multer({
  storage: createStorage(STORAGE_PATHS.posts),
  fileFilter,
  limits,
});

export const uploadChatMedia = multer({
  storage: createStorage(STORAGE_PATHS.chat),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB para chat e vídeos
});
