import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getClips(req: AuthRequest, res: Response) {
  const currentUserId = req.user?.id;
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '10'), 10);
  const skip = (page - 1) * limit;

  // Busca publicações que contêm pelo menos um vídeo
  const postsWithVideo = await prisma.post.findMany({
    where: {
      deletedAt: null,
      user: { isPrivate: false },
      media: {
        some: { mediaType: 'VIDEO' },
      },
    },
    include: {
      media: { where: { mediaType: 'VIDEO' }, take: 1 },
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
      likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      savedBy: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
    },
    orderBy: [{ viewsCount: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: limit,
  });

  const clips = postsWithVideo.map((p: any) => ({
    id: p.id,
    caption: p.caption,
    location: p.location,
    viewsCount: p.viewsCount || 0,
    createdAt: p.createdAt,
    user: p.user,
    videoUrl: p.media[0]?.url || '',
    likesCount: p._count.likes,
    commentsCount: p._count.comments,
    isLiked: Array.isArray(p.likes) && p.likes.length > 0,
    isSaved: Array.isArray(p.savedBy) && p.savedBy.length > 0,
  }));

  return res.json({
    success: true,
    clips,
    page,
    hasMore: postsWithVideo.length === limit,
  });
}

export async function incrementClipView(req: AuthRequest, res: Response) {
  const postId = String(req.params.postId || '');

  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } },
      select: { id: true, viewsCount: true },
    });

    return res.json({ success: true, viewsCount: post.viewsCount });
  } catch (e) {
    return res.status(404).json({ success: false, message: 'Publicação não encontrada.' });
  }
}
