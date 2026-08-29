import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { emitNotification } from '../socket/socket.handler';

export async function addComment(req: AuthRequest, res: Response) {
  const schema = z.object({
    content: z.string().min(1, 'O comentário não pode ficar vazio.').max(1000),
    parentId: z.string().optional().nullable(),
  });

  const { content, parentId } = schema.parse(req.body);
  const postId = String(req.params.postId || '');
  const currentUserId = req.user!.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true },
  });

  if (!post) {
    return res.status(404).json({ success: false, message: 'Publicação não encontrada.' });
  }

  let parentComment = null;
  if (parentId) {
    parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parentComment) {
      return res.status(404).json({ success: false, message: 'Comentário pai não encontrado.' });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      userId: currentUserId,
      postId,
      parentId: parentId || null,
      content: content.trim(),
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  if (parentComment && parentComment.userId !== currentUserId) {
    const notification = await prisma.notification.create({
      data: {
        recipientId: parentComment.userId,
        actorId: currentUserId,
        type: 'REPLY_COMMENT',
        entityId: postId,
      },
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });
    emitNotification(parentComment.userId, notification);
  } else if (post.userId !== currentUserId) {
    const notification = await prisma.notification.create({
      data: {
        recipientId: post.userId,
        actorId: currentUserId,
        type: 'COMMENT_POST',
        entityId: postId,
      },
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });
    emitNotification(post.userId, notification);
  }

  const commentsCount = await prisma.comment.count({ where: { postId } });

  return res.status(201).json({
    success: true,
    message: 'Comentário publicado!',
    comment: {
      ...comment,
      replies: [],
    },
    commentsCount,
  });
}

export async function getComments(req: AuthRequest, res: Response) {
  const postId = String(req.params.postId || '');

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null,
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      replies: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return res.json({ success: true, comments });
}

export async function deleteComment(req: AuthRequest, res: Response) {
  const commentId = String(req.params.commentId || '');
  const currentUserId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { userId: true } } },
  });

  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comentário não encontrado.' });
  }

  const isPostOwner = comment.post.userId === currentUserId;
  const isCommentOwner = comment.userId === currentUserId;

  if (!isCommentOwner && !isPostOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Permissão negada para excluir comentário.' });
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  const commentsCount = await prisma.comment.count({ where: { postId: comment.postId } });

  return res.json({ success: true, message: 'Comentário excluído!', commentsCount });
}
