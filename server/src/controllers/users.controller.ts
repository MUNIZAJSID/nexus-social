import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { deleteStorageFile } from '../services/storage.service';

export async function getUserProfile(req: AuthRequest, res: Response) {
  const username = String(req.params.username || '').toLowerCase();
  const currentUserId = req.user?.id;

  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      website: true,
      bio: true,
      isPrivate: true,
      isVerified: true,
      role: true,
      createdAt: true,
      highlights: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          posts: { where: { deletedAt: null } },
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Perfil de usuário não encontrado.' });
  }

  let isFollowing = false;
  let hasRequestedFollow = false;
  const isSelf = currentUserId === targetUser.id;

  if (currentUserId && !isSelf) {
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });
    isFollowing = !!followRecord;

    if (!isFollowing) {
      const requestRecord = await prisma.followRequest.findUnique({
        where: {
          requesterId_targetId: {
            requesterId: currentUserId,
            targetId: targetUser.id,
          },
        },
      });
      hasRequestedFollow = !!requestRecord && requestRecord.status === 'PENDING';
    }
  }

  return res.json({
    success: true,
    profile: {
      ...targetUser,
      counts: targetUser._count,
      isSelf,
      isFollowing,
      hasRequestedFollow,
      canViewContent: isSelf || !targetUser.isPrivate || isFollowing,
    },
  });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const schema = z.object({
    displayName: z.string().min(2).max(50).optional(),
    bio: z.string().max(250).optional(),
    website: z.string().max(100).optional().nullable(),
    isPrivate: z.boolean().optional(),
  });

  const data = schema.parse(req.body);
  const userId = req.user!.id;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      coverUrl: true,
      website: true,
      bio: true,
      isPrivate: true,
      isVerified: true,
      role: true,
      createdAt: true,
    },
  });

  return res.json({
    success: true,
    message: 'Perfil atualizado com sucesso!',
    user: updatedUser,
  });
}

export async function updateAvatar(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'Nenhuma imagem foi enviada.' });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  if (currentUser?.avatarUrl) {
    deleteStorageFile(currentUser.avatarUrl);
  }

  const avatarUrl = `/storage/avatars/${file.filename}`;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      website: true,
      bio: true,
      isPrivate: true,
      isVerified: true,
      role: true,
    },
  });

  return res.json({
    success: true,
    message: 'Foto de perfil atualizada!',
    avatarUrl,
    user: updatedUser,
  });
}

export async function getUserFollowers(req: AuthRequest, res: Response) {
  const username = String(req.params.username || '').toLowerCase();
  const currentUserId = req.user?.id;

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  const followers = await prisma.follow.findMany({
    where: { followingId: targetUser.id },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          isPrivate: true,
          isVerified: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const followerList = await Promise.all(
    followers.map(async (f) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== f.follower.id) {
        const isFollow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: f.follower.id,
            },
          },
        });
        isFollowing = !!isFollow;
      }
      return {
        ...f.follower,
        isFollowing,
        isSelf: currentUserId === f.follower.id,
      };
    })
  );

  return res.json({ success: true, followers: followerList });
}

export async function getUserFollowing(req: AuthRequest, res: Response) {
  const username = String(req.params.username || '').toLowerCase();
  const currentUserId = req.user?.id;

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  const followings = await prisma.follow.findMany({
    where: { followerId: targetUser.id },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          isPrivate: true,
          isVerified: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const followingList = await Promise.all(
    followings.map(async (f) => {
      let isFollowing = false;
      if (currentUserId && currentUserId !== f.following.id) {
        const isFollow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: f.following.id,
            },
          },
        });
        isFollowing = !!isFollow;
      }
      return {
        ...f.following,
        isFollowing,
        isSelf: currentUserId === f.following.id,
      };
    })
  );

  return res.json({ success: true, following: followingList });
}

export async function getSuggestedUsers(req: AuthRequest, res: Response) {
  const currentUserId = req.user?.id;

  const myFollowings = currentUserId
    ? await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      })
    : [];

  const excludeIds = [currentUserId || '', ...myFollowings.map((f) => f.followingId)].filter(Boolean);

  const suggestedUsers = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      isBlocked: false,
    },
    take: 6,
    orderBy: [{ isVerified: 'desc' }, { followers: { _count: 'desc' } }, { createdAt: 'desc' }],
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      isPrivate: true,
      isVerified: true,
      _count: {
        select: { followers: true, posts: true },
      },
    },
  });

  return res.json({ success: true, suggestions: suggestedUsers });
}
