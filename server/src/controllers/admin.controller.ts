import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getStorageStats, deleteStorageFile } from '../services/storage.service';

export async function getAdminOverview(_req: AuthRequest, res: Response) {
  const [totalUsers, totalPosts, totalMessages, totalComments, totalLikes] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.message.count(),
    prisma.comment.count(),
    prisma.like.count(),
  ]);

  const storage = getStorageStats();

  const latestUsers = await prisma.user.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      role: true,
      isBlocked: true,
      createdAt: true,
    },
  });

  return res.json({
    success: true,
    stats: {
      totalUsers,
      totalPosts,
      totalMessages,
      totalComments,
      totalLikes,
      storage,
    },
    latestUsers,
  });
}

export async function getAllUsers(req: AuthRequest, res: Response) {
  const query = ((req.query.q as string) || '').trim().toLowerCase();

  const whereCondition: any = {};
  if (query) {
    whereCondition.OR = [
      { username: { contains: query } },
      { displayName: { contains: query } },
      { email: { contains: query } },
    ];
  }

  const users = await prisma.user.findMany({
    where: whereCondition,
    include: {
      _count: {
        select: { posts: true, followers: true, following: true, sentMessages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ success: true, users });
}

export async function toggleUserBlock(req: AuthRequest, res: Response) {
  const userId = String(req.params.userId || '');
  const currentAdminId = req.user!.id;

  if (userId === currentAdminId) {
    return res.status(400).json({ success: false, message: 'Você não pode bloquear sua própria conta de administrador.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: !user.isBlocked },
  });

  return res.json({
    success: true,
    isBlocked: updated.isBlocked,
    message: updated.isBlocked ? 'Usuário bloqueado com sucesso.' : 'Usuário desbloqueado com sucesso.',
  });
}

export async function toggleUserRole(req: AuthRequest, res: Response) {
  const userId = String(req.params.userId || '');
  const currentAdminId = req.user!.id;

  if (userId === currentAdminId) {
    return res.status(400).json({ success: false, message: 'Você não pode alterar seu próprio nível de permissão.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  return res.json({
    success: true,
    role: updated.role,
    message: `Permissão alterada para ${newRole}.`,
  });
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const userId = String(req.params.userId || '');
  const currentAdminId = req.user!.id;

  if (userId === currentAdminId) {
    return res.status(400).json({ success: false, message: 'Você não pode excluir sua própria conta.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: { include: { media: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  if (user.avatarUrl) {
    deleteStorageFile(user.avatarUrl);
  }

  user.posts.forEach((post: any) => {
    post.media.forEach((m: any) => deleteStorageFile(m.url));
  });

  await prisma.user.delete({
    where: { id: userId },
  });

  return res.json({ success: true, message: 'Usuário e todos os seus dados foram excluídos.' });
}

export async function getAllPosts(_req: AuthRequest, res: Response) {
  const posts = await prisma.post.findMany({
    include: {
      media: { orderBy: { order: 'asc' } },
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ success: true, posts });
}
