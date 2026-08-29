import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getNotifications(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const skip = (page - 1) * limit;

  const notifications = await prisma.notification.findMany({
    where: { recipientId: currentUserId },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: { recipientId: currentUserId, isRead: false },
  });

  return res.json({
    success: true,
    notifications,
    unreadCount,
  });
}

export async function markAllNotificationsAsRead(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;

  await prisma.notification.updateMany({
    where: { recipientId: currentUserId, isRead: false },
    data: { isRead: true },
  });

  return res.json({ success: true, message: 'Todas as notificações marcadas como lidas.' });
}

export async function getUnreadNotificationCount(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;

  const unreadCount = await prisma.notification.count({
    where: { recipientId: currentUserId, isRead: false },
  });

  return res.json({ success: true, unreadCount });
}
