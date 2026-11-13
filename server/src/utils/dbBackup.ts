import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { prisma } from '../db/prisma';
import { STORAGE_PATHS } from '../services/storage.service';

export function findActiveSqliteDbPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'prisma/localsocial.db'),
    path.resolve(process.cwd(), 'server/prisma/localsocial.db'),
    path.resolve(__dirname, '../../prisma/localsocial.db'),
    path.resolve(process.cwd(), 'localsocial.db'),
    path.resolve(process.cwd(), 'server/localsocial.db'),
  ];

  for (const dbPath of candidates) {
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      if (stat.isFile() && stat.size > 0) {
        return dbPath;
      }
    }
  }
  return null;
}

export interface BackupResult {
  filename: string;
  filePath: string;
  size: string;
  createdAt: Date;
  dbPath: string | null;
  usedJsonFallback: boolean;
  storageIncluded: boolean;
}

async function buildJsonFallbackSnapshot(): Promise<string> {
  const [users, posts, stories, highlights, follows, conversations, messages, notifications] =
    await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          coverUrl: true,
          bio: true,
          website: true,
          isPrivate: true,
          isBlocked: true,
          isVerified: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.post.findMany({ include: { media: true, comments: true, likes: true } }),
      prisma.story.findMany({ include: { stickers: true, likes: true, views: true } }),
      prisma.highlight.findMany({ include: { items: true } }),
      prisma.follow.findMany(),
      prisma.conversation.findMany({ include: { members: true } }),
      prisma.message.findMany(),
      prisma.notification.findMany(),
    ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      users,
      posts,
      stories,
      highlights,
      follows,
      conversations,
      messages,
      notifications,
    },
    null,
    2
  );
}

export async function createZipBackup(): Promise<BackupResult> {
  if (!fs.existsSync(STORAGE_PATHS.backups)) {
    fs.mkdirSync(STORAGE_PATHS.backups, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const filename = `localsocial_backup_${timestamp}.zip`;
  const filePath = path.join(STORAGE_PATHS.backups, filename);

  const dbPath = findActiveSqliteDbPath();
  let usedJsonFallback = false;
  let storageIncluded = false;

  const output = fs.createWriteStream(filePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  const finishPromise = new Promise<number>((resolve, reject) => {
    output.on('close', () => {
      const stats = fs.statSync(filePath);
      resolve(stats.size);
    });
    output.on('error', reject);
    archive.on('error', reject);
  });

  archive.pipe(output);

  if (dbPath) {
    archive.file(dbPath, { name: 'database/localsocial.db' });
  } else {
    usedJsonFallback = true;
    const jsonContent = await buildJsonFallbackSnapshot();
    archive.append(jsonContent, { name: 'database/snapshot.json' });
  }

  if (fs.existsSync(STORAGE_PATHS.root)) {
    archive.directory(STORAGE_PATHS.root, 'storage');
    storageIncluded = true;
  }

  await archive.finalize();
  const totalBytes = await finishPromise;

  return {
    filename,
    filePath,
    size: `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
    createdAt: new Date(),
    dbPath,
    usedJsonFallback,
    storageIncluded,
  };
}
