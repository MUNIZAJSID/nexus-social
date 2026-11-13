import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { buildCaseVariants } from '../utils/queryHelpers';

export async function search(req: AuthRequest, res: Response) {
  const rawQuery = ((req.query.q as string) || '').trim();
  const query = rawQuery.toLowerCase();
  const currentUserId = req.user?.id;

  if (!query) {
    return res.json({ success: true, users: [], posts: [] });
  }

  const variants = buildCaseVariants(rawQuery);

  // Busca usuários
  const users = await prisma.user.findMany({
    where: {
      isBlocked: false,
      OR: variants.flatMap((v) => [
        { username: { contains: v } },
        { displayName: { contains: v } },
      ]),
    },
    take: 20,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      isPrivate: true,
      isVerified: true,
      _count: {
        select: {
          followers: true,
          posts: { where: { deletedAt: null } },
        },
      },
    },
  });

  const formattedUsers = await Promise.all(
    users.map(async (u) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== u.id) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: u.id,
            },
          },
        });
        isFollowing = !!follow;
      }
      return {
        ...u,
        isFollowing,
        isSelf: currentUserId === u.id,
      };
    })
  );

  // Busca posts públicos com legenda correspondente
  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      user: { isPrivate: false },
      OR: variants.flatMap((v) => [
        { caption: { contains: v } },
        { location: { contains: v } },
      ]),
    },
    include: {
      media: { orderBy: { order: 'asc' } },
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    success: true,
    users: formattedUsers,
    posts: posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      location: p.location,
      media: p.media,
      user: p.user,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
    })),
  });
}
