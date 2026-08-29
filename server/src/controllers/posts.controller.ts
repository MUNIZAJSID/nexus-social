import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { deleteStorageFile } from '../services/storage.service';

export async function createPost(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const files = req.files as Express.Multer.File[];
  const caption = (req.body.caption || '').trim();
  const location = (req.body.location || '').trim();
  const musicTitle = (req.body.musicTitle || '').trim() || null;
  const musicArtist = (req.body.musicArtist || '').trim() || null;
  const musicCoverUrl = (req.body.musicCoverUrl || '').trim() || null;
  const musicAudioUrl = (req.body.musicAudioUrl || '').trim() || null;

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, message: 'É obrigatório enviar pelo menos uma foto ou vídeo.' });
  }

  const post = await prisma.post.create({
    data: {
      userId,
      caption: caption || null,
      location: location || null,
      musicTitle,
      musicArtist,
      musicCoverUrl,
      musicAudioUrl,
      media: {
        create: files.map((file, index) => {
          const isVideo = file.mimetype.startsWith('video/');
          return {
            url: `/storage/posts/${file.filename}`,
            mediaType: isVideo ? 'VIDEO' : 'IMAGE',
            order: index,
          };
        }),
      },
    },
    include: {
      media: { orderBy: { order: 'asc' } },
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Publicação criada com sucesso!',
    post: {
      ...post,
      viewsCount: 0,
      isLiked: false,
      isSaved: false,
      likesCount: 0,
      commentsCount: 0,
    },
  });
}

function formatPost(p: any) {
  return {
    id: p.id,
    caption: p.caption,
    location: p.location,
    musicTitle: p.musicTitle || null,
    musicArtist: p.musicArtist || null,
    musicCoverUrl: p.musicCoverUrl || null,
    musicAudioUrl: p.musicAudioUrl || null,
    viewsCount: p.viewsCount || 0,
    createdAt: p.createdAt,
    user: p.user,
    media: p.media,
    likesCount: p._count?.likes ?? 0,
    commentsCount: p._count?.comments ?? 0,
    isLiked: Array.isArray(p.likes) && p.likes.length > 0,
    isSaved: Array.isArray(p.savedBy) && p.savedBy.length > 0,
  };
}

export async function getFeed(req: AuthRequest, res: Response) {
  const currentUserId = req.user?.id;
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '15'), 10);
  const skip = (page - 1) * limit;

  let followingIds: string[] = [];
  if (currentUserId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    followingIds = follows.map((f) => f.followingId);
  }

  const whereCondition: any = {
    deletedAt: null,
  };

  if (currentUserId && followingIds.length > 0) {
    whereCondition.OR = [
      { userId: { in: [...followingIds, currentUserId] } },
      { user: { isPrivate: false } },
    ];
  } else {
    whereCondition.user = { isPrivate: false };
  }

  const posts = await prisma.post.findMany({
    where: whereCondition,
    include: {
      media: { orderBy: { order: 'asc' } },
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isPrivate: true, isVerified: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
      likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      savedBy: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const formattedPosts = posts.map(formatPost);

  return res.json({
    success: true,
    posts: formattedPosts,
    page,
    hasMore: posts.length === limit,
  });
}

export async function getExplorePosts(req: AuthRequest, res: Response) {
  const currentUserId = req.user?.id;
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '24'), 10);
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      user: { isPrivate: false },
    },
    include: {
      media: { orderBy: { order: 'asc' } },
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
      likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      savedBy: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
    },
    orderBy: [{ likes: { _count: 'desc' } }, { viewsCount: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: limit,
  });

  const formattedPosts = posts.map(formatPost);

  return res.json({
    success: true,
    posts: formattedPosts,
    page,
    hasMore: posts.length === limit,
  });
}

export async function getUserPosts(req: AuthRequest, res: Response) {
  const username = String(req.params.username || '').toLowerCase();
  const currentUserId = req.user?.id;

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  if (targetUser.isPrivate && currentUserId !== targetUser.id) {
    const isFollowing = currentUserId
      ? await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: targetUser.id,
            },
          },
        })
      : null;

    if (!isFollowing && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Esta conta é privada. Siga este perfil para ver suas publicações.',
        isPrivateLocked: true,
      });
    }
  }

  const posts = await prisma.post.findMany({
    where: {
      userId: targetUser.id,
      deletedAt: null,
    },
    include: {
      media: { orderBy: { order: 'asc' } },
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
      likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      savedBy: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedPosts = posts.map(formatPost);

  return res.json({ success: true, posts: formattedPosts });
}

export async function getSavedPosts(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;

  const saved = await prisma.savedPost.findMany({
    where: { userId: currentUserId },
    include: {
      post: {
        include: {
          media: { orderBy: { order: 'asc' } },
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
          likes: { where: { userId: currentUserId }, select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const posts = saved
    .filter((s) => s.post && !s.post.deletedAt)
    .map((s) => ({
      ...formatPost(s.post),
      isSaved: true,
    }));

  return res.json({ success: true, posts });
}

export async function getPostById(req: AuthRequest, res: Response) {
  const postId = String(req.params.postId || '');
  const currentUserId = req.user?.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      media: { orderBy: { order: 'asc' } },
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isPrivate: true, isVerified: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
      likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      savedBy: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
    },
  });

  if (!post || post.deletedAt) {
    return res.status(404).json({ success: false, message: 'Publicação não encontrada.' });
  }

  // Incrementa contagem de visualização
  await prisma.post.update({
    where: { id: postId },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  return res.json({
    success: true,
    post: {
      ...formatPost(post),
      viewsCount: (post.viewsCount || 0) + 1,
    },
  });
}

export async function deletePost(req: AuthRequest, res: Response) {
  const postId = String(req.params.postId || '');
  const currentUserId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { media: true },
  });

  if (!post) {
    return res.status(404).json({ success: false, message: 'Publicação não encontrada.' });
  }

  if (post.userId !== currentUserId && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Você não tem permissão para excluir esta publicação.' });
  }

  post.media.forEach((m: { url: string }) => {
    deleteStorageFile(m.url);
  });

  await prisma.post.delete({
    where: { id: postId },
  });

  return res.json({ success: true, message: 'Publicação excluída com sucesso!' });
}

export async function toggleSavePost(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const postId = String(req.params.postId || '');

  const existingSave = await prisma.savedPost.findUnique({
    where: {
      userId_postId: {
        userId: currentUserId,
        postId,
      },
    },
  });

  if (existingSave) {
    await prisma.savedPost.delete({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId,
        },
      },
    });

    return res.json({ success: true, isSaved: false, message: 'Publicação removida dos itens salvos.' });
  }

  await prisma.savedPost.create({
    data: {
      userId: currentUserId,
      postId,
    },
  });

  return res.json({ success: true, isSaved: true, message: 'Publicação salva!' });
}
