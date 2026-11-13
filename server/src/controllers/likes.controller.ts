import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { emitNotification } from '../socket/socket.handler';

export async function toggleLikePost(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const postId = String(req.params.postId || '');

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, deletedAt: true },
  });

  if (!post || post.deletedAt) {
    return res.status(404).json({ success: false, message: 'Publicação não encontrada.' });
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId: currentUserId,
        postId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.deleteMany({
      where: {
        userId: currentUserId,
        postId,
      },
    });

    const likesCount = await prisma.like.count({ where: { postId } });

    return res.json({
      success: true,
      isLiked: false,
      likesCount,
    });
  }

  let createdNewLike = false;
  try {
    await prisma.like.create({
      data: {
        userId: currentUserId,
        postId,
      },
    });
    createdNewLike = true;
  } catch (err: any) {
    if (err?.code !== 'P2002') throw err;
  }

  const likesCount = await prisma.like.count({ where: { postId } });

  if (createdNewLike && post.userId !== currentUserId) {
    const notification = await prisma.notification.create({
      data: {
        recipientId: post.userId,
        actorId: currentUserId,
        type: 'LIKE_POST',
        entityId: postId,
      },
      include: {
        actor: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    emitNotification(post.userId, notification);
  }

  return res.json({
    success: true,
    isLiked: true,
    likesCount,
  });
}

export async function getPostLikes(req: AuthRequest, res: Response) {
  const postId = String(req.params.postId || '');
  const currentUserId = req.user?.id;

  const likes = await prisma.like.findMany({
    where: { postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const users = await Promise.all(
    likes.map(async (l: any) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== l.user.id) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: l.user.id,
            },
          },
        });
        isFollowing = !!follow;
      }
      return {
        ...l.user,
        isFollowing,
        isSelf: currentUserId === l.user.id,
      };
    })
  );

  return res.json({ success: true, users });
}
