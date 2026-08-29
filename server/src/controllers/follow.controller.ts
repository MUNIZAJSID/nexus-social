import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { emitNotification } from '../socket/socket.handler';

export async function toggleFollow(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const targetUserId = String(req.params.targetUserId || '');

  if (currentUserId === targetUserId) {
    return res.status(400).json({ success: false, message: 'Você não pode seguir a si mesmo.' });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });

  if (existingFollow) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    return res.json({
      success: true,
      action: 'UNFOLLOWED',
      message: `Você deixou de seguir @${targetUser.username}.`,
    });
  }

  if (targetUser.isPrivate) {
    const existingRequest = await prisma.followRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId: currentUserId,
          targetId: targetUserId,
        },
      },
    });

    if (existingRequest && existingRequest.status === 'PENDING') {
      await prisma.followRequest.delete({
        where: { id: existingRequest.id },
      });
      return res.json({
        success: true,
        action: 'REQUEST_CANCELLED',
        message: 'Solicitação de seguir cancelada.',
      });
    }

    const request = await prisma.followRequest.upsert({
      where: {
        requesterId_targetId: {
          requesterId: currentUserId,
          targetId: targetUserId,
        },
      },
      update: { status: 'PENDING' },
      create: {
        requesterId: currentUserId,
        targetId: targetUserId,
        status: 'PENDING',
      },
    });

    const notification = await prisma.notification.create({
      data: {
        recipientId: targetUserId,
        actorId: currentUserId,
        type: 'FOLLOW_REQUEST',
        entityId: request.id,
      },
      include: {
        actor: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    emitNotification(targetUserId, notification);

    return res.json({
      success: true,
      action: 'REQUESTED',
      message: 'Solicitação de seguir enviada!',
    });
  }

  await prisma.follow.create({
    data: {
      followerId: currentUserId,
      followingId: targetUserId,
    },
  });

  const notification = await prisma.notification.create({
    data: {
      recipientId: targetUserId,
      actorId: currentUserId,
      type: 'FOLLOW',
      entityId: currentUserId,
    },
    include: {
      actor: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  emitNotification(targetUserId, notification);

  return res.json({
    success: true,
    action: 'FOLLOWED',
    message: `Você agora está seguindo @${targetUser.username}!`,
  });
}

export async function getFollowRequests(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;

  const requests = await prisma.followRequest.findMany({
    where: {
      targetId: currentUserId,
      status: 'PENDING',
    },
    include: {
      requester: {
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

  return res.json({ success: true, requests });
}

export async function respondFollowRequest(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const requestId = String(req.params.requestId || '');
  const { action } = req.body;

  const request = await prisma.followRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.targetId !== currentUserId) {
    return res.status(404).json({ success: false, message: 'Solicitação não encontrada.' });
  }

  if (action === 'ACCEPT') {
    await prisma.$transaction([
      prisma.followRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      prisma.follow.create({
        data: {
          followerId: request.requesterId,
          followingId: currentUserId,
        },
      }),
    ]);

    const notification = await prisma.notification.create({
      data: {
        recipientId: request.requesterId,
        actorId: currentUserId,
        type: 'FOLLOW_ACCEPT',
        entityId: currentUserId,
      },
      include: {
        actor: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    emitNotification(request.requesterId, notification);

    return res.json({ success: true, message: 'Solicitação aceita com sucesso!' });
  } else {
    await prisma.followRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return res.json({ success: true, message: 'Solicitação recusada.' });
  }
}
