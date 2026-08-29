import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { emitNotification, emitChatMessage } from '../socket/socket.handler';

export async function getStoriesFeed(req: AuthRequest, res: Response) {
  const currentUserId = req.user?.id;
  const now = new Date();

  // Busca todos os stories que ainda não expiraram
  const activeStories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      user: { isBlocked: false },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      views: {
        select: { userId: true },
      },
      likes: {
        select: { userId: true },
      },
      stickers: {
        include: {
          interactions: {
            include: {
              user: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          views: true,
          likes: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Agrupa stories por usuário
  const userStoriesMap = new Map<string, { user: any; stories: any[]; hasUnseen: boolean }>();

  activeStories.forEach((story) => {
    const u = story.user;
    const isViewed = currentUserId ? story.views.some((v) => v.userId === currentUserId) : false;
    const isLiked = currentUserId ? story.likes.some((l) => l.userId === currentUserId) : false;

    // Formata figurinhas com contagens e interação do usuário logado
    const formattedStickers = story.stickers.map((stk) => {
      let parsedOptions: string[] = ['Sim', 'Não'];
      try {
        if (stk.options) parsedOptions = JSON.parse(stk.options);
      } catch {}

      const userInteraction = currentUserId ? stk.interactions.find((it) => it.userId === currentUserId) : null;
      const totalVotes = stk.interactions.filter((it) => it.voteIndex !== null).length;
      
      const voteCounts = parsedOptions.map((_, idx) =>
        stk.interactions.filter((it) => it.voteIndex === idx).length
      );

      return {
        id: stk.id,
        type: stk.type,
        question: stk.question,
        options: parsedOptions,
        posX: stk.posX,
        posY: stk.posY,
        totalVotes,
        voteCounts,
        userVote: userInteraction?.voteIndex ?? null,
        userAnswer: userInteraction?.answerText ?? null,
        answers: currentUserId === u.id ? stk.interactions.filter((it) => it.answerText).map((it) => ({
          id: it.id,
          user: it.user,
          answer: it.answerText,
          createdAt: it.createdAt,
        })) : [],
      };
    });

    if (!userStoriesMap.has(u.id)) {
      userStoriesMap.set(u.id, {
        user: u,
        stories: [],
        hasUnseen: false,
      });
    }

    const group = userStoriesMap.get(u.id)!;
    if (!isViewed && currentUserId !== u.id) {
      group.hasUnseen = true;
    }

    group.stories.push({
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      duration: story.duration || (story.mediaType === 'VIDEO' ? 15 : 10),
      musicTitle: story.musicTitle,
      musicArtist: story.musicArtist,
      musicCoverUrl: story.musicCoverUrl,
      musicAudioUrl: story.musicAudioUrl,
      musicStartTime: story.musicStartTime || 0,
      musicDuration: story.musicDuration || 30,
      stickers: formattedStickers,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      viewsCount: story._count.views,
      likesCount: story._count.likes,
      isLiked,
      isViewed,
      isOwner: currentUserId === u.id,
    });
  });

  // Converte em array, colocando o usuário atual primeiro se tiver story
  const storiesGroups = Array.from(userStoriesMap.values());
  if (currentUserId) {
    const myIndex = storiesGroups.findIndex((g) => g.user.id === currentUserId);
    if (myIndex > 0) {
      const [myGroup] = storiesGroups.splice(myIndex, 1);
      storiesGroups.unshift(myGroup);
    }
  }

  return res.json({
    success: true,
    stories: storiesGroups,
  });
}

export async function createStory(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const file = req.file;
  const caption = (req.body.caption || '').trim();
  const duration = Math.min(Math.max(parseInt(String(req.body.duration || '10'), 10) || 10, 3), 30);
  const musicTitle = (req.body.musicTitle || '').trim() || null;
  const musicArtist = (req.body.musicArtist || '').trim() || null;
  const musicCoverUrl = (req.body.musicCoverUrl || '').trim() || null;
  const musicAudioUrl = (req.body.musicAudioUrl || '').trim() || null;
  const musicStartTime = parseFloat(String(req.body.musicStartTime || '0')) || 0;
  const musicDuration = parseInt(String(req.body.musicDuration || '30'), 10) || 30;

  let stickersToCreate: any[] = [];
  if (req.body.stickers) {
    try {
      const parsed = typeof req.body.stickers === 'string' ? JSON.parse(req.body.stickers) : req.body.stickers;
      if (Array.isArray(parsed)) {
        stickersToCreate = parsed.map((stk: any) => ({
          type: stk.type || 'POLL',
          question: (stk.question || '').trim() || 'Enquete',
          options: stk.options ? JSON.stringify(stk.options) : JSON.stringify(['Sim', 'Não']),
          posX: typeof stk.posX === 'number' ? stk.posX : 50,
          posY: typeof stk.posY === 'number' ? stk.posY : 50,
        }));
      }
    } catch (e) {
      console.warn('Erro ao processar stickers:', e);
    }
  }

  if (!file) {
    return res.status(400).json({ success: false, message: 'É obrigatório enviar uma foto ou vídeo para o story.' });
  }

  const isVideo = file.mimetype.startsWith('video/');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  const story = await prisma.story.create({
    data: {
      userId,
      mediaUrl: `/storage/posts/${file.filename}`,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
      caption: caption || null,
      duration,
      musicTitle,
      musicArtist,
      musicCoverUrl,
      musicAudioUrl,
      musicStartTime,
      musicDuration,
      expiresAt,
      stickers: {
        create: stickersToCreate,
      },
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
      },
      stickers: true,
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Story publicado com sucesso!',
    story,
  });
}

export async function viewStory(req: AuthRequest, res: Response) {
  const currentUserId = req.user?.id;
  const storyId = String(req.params.storyId || '');

  if (!currentUserId || !storyId) {
    return res.status(400).json({ success: false, message: 'Parâmetros inválidos.' });
  }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, userId: true },
  });

  if (!story) {
    return res.status(404).json({ success: false, message: 'Story não encontrado.' });
  }

  // Não conta visualização do próprio autor
  if (story.userId !== currentUserId) {
    await prisma.storyView.upsert({
      where: {
        storyId_userId: {
          storyId,
          userId: currentUserId,
        },
      },
      create: {
        storyId,
        userId: currentUserId,
      },
      update: {},
    });
  }

  const viewsCount = await prisma.storyView.count({ where: { storyId } });

  return res.json({ success: true, viewsCount });
}

export async function toggleLikeStory(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const storyId = String(req.params.storyId || '');

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, userId: true },
  });

  if (!story) {
    return res.status(404).json({ success: false, message: 'Story não encontrado.' });
  }

  const existingLike = await prisma.storyLike.findUnique({
    where: {
      storyId_userId: {
        storyId,
        userId: currentUserId,
      },
    },
  });

  if (existingLike) {
    await prisma.storyLike.delete({
      where: {
        storyId_userId: {
          storyId,
          userId: currentUserId,
        },
      },
    });

    const likesCount = await prisma.storyLike.count({ where: { storyId } });
    return res.json({ success: true, isLiked: false, likesCount });
  }

  await prisma.storyLike.create({
    data: {
      storyId,
      userId: currentUserId,
    },
  });

  const likesCount = await prisma.storyLike.count({ where: { storyId } });

  if (story.userId !== currentUserId) {
    const notification = await prisma.notification.create({
      data: {
        recipientId: story.userId,
        actorId: currentUserId,
        type: 'LIKE_POST',
        entityId: storyId,
      },
      include: {
        actor: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    emitNotification(story.userId, notification);
  }

  return res.json({ success: true, isLiked: true, likesCount });
}

export async function getStoryViewers(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const storyId = String(req.params.storyId || '');

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, userId: true },
  });

  if (!story) {
    return res.status(404).json({ success: false, message: 'Story não encontrado.' });
  }

  if (story.userId !== currentUserId) {
    return res.status(403).json({ success: false, message: 'Apenas o autor pode ver a lista de visualizadores.' });
  }

  const [views, likes] = await Promise.all([
    prisma.storyView.findMany({
      where: { storyId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.storyLike.findMany({
      where: { storyId },
      select: { userId: true },
    }),
  ]);

  const likedUserIds = new Set(likes.map((l) => l.userId));

  const viewers = views.map((v) => ({
    ...v.user,
    viewedAt: v.createdAt,
    hasLiked: likedUserIds.has(v.userId),
  }));

  return res.json({
    success: true,
    viewersCount: viewers.length,
    likesCount: likes.length,
    viewers,
  });
}

export async function deleteStory(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const storyId = String(req.params.storyId || '');

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, userId: true },
  });

  if (!story) {
    return res.status(404).json({ success: false, message: 'Story não encontrado.' });
  }

  if (story.userId !== currentUserId && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Permissão negada.' });
  }

  await prisma.story.delete({ where: { id: storyId } });

  return res.json({ success: true, message: 'Story excluído com sucesso.' });
}

export async function getUserHighlights(req: AuthRequest, res: Response) {
  const username = String(req.params.username || '').toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  const highlights = await prisma.highlight.findMany({
    where: { userId: user.id },
    include: {
      items: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ success: true, highlights });
}

export async function voteStorySticker(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const stickerId = String(req.params.stickerId || '');
  const { voteIndex } = req.body;

  if (voteIndex === undefined || typeof voteIndex !== 'number') {
    return res.status(400).json({ success: false, message: 'voteIndex é obrigatório.' });
  }

  try {
    await prisma.storyStickerInteraction.upsert({
      where: {
        stickerId_userId: { stickerId, userId },
      },
      update: { voteIndex },
      create: { stickerId, userId, voteIndex },
    });

    const allInteractions = await prisma.storyStickerInteraction.findMany({
      where: { stickerId },
    });

    const sticker = await prisma.storySticker.findUnique({ where: { id: stickerId } });
    let optionsCount = 2;
    if (sticker?.options) {
      try {
        optionsCount = JSON.parse(sticker.options).length;
      } catch {}
    }

    const voteCounts = Array.from({ length: optionsCount }, (_, idx) =>
      allInteractions.filter((it) => it.voteIndex === idx).length
    );

    return res.json({
      success: true,
      userVote: voteIndex,
      totalVotes: allInteractions.filter((it) => it.voteIndex !== null).length,
      voteCounts,
    });
  } catch (error) {
    console.error('Erro ao votar na enquete:', error);
    return res.status(500).json({ success: false, message: 'Erro ao registrar voto.' });
  }
}

export async function answerStorySticker(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const stickerId = String(req.params.stickerId || '');
  const { answerText } = req.body;

  if (!answerText || !String(answerText).trim()) {
    return res.status(400).json({ success: false, message: 'A resposta não pode estar vazia.' });
  }

  try {
    await prisma.storyStickerInteraction.upsert({
      where: {
        stickerId_userId: { stickerId, userId },
      },
      update: { answerText: String(answerText).trim() },
      create: { stickerId, userId, answerText: String(answerText).trim() },
    });

    return res.json({
      success: true,
      message: 'Resposta enviada com sucesso!',
      userAnswer: String(answerText).trim(),
    });
  } catch (error) {
    console.error('Erro ao enviar resposta:', error);
    return res.status(500).json({ success: false, message: 'Erro ao enviar resposta.' });
  }
}

export async function replyToStory(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const storyId = String(req.params.storyId || '');
  const { message: replyText } = req.body;

  if (!replyText || !String(replyText).trim()) {
    return res.status(400).json({ success: false, message: 'A mensagem de resposta não pode estar vazia.' });
  }

  try {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, userId: true, mediaUrl: true, mediaType: true },
    });

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story não encontrado.' });
    }

    const targetUserId = story.userId;
    if (targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Você não pode responder ao seu próprio Story.' });
    }

    // Localiza ou cria a conversa direta
    const myConversations = await prisma.conversationMember.findMany({
      where: { userId: currentUserId },
      select: { conversationId: true },
    });
    const myConvIds = myConversations.map((c) => c.conversationId);

    let conversation = await prisma.conversation.findFirst({
      where: {
        id: { in: myConvIds },
        isGroup: false,
        members: {
          some: { userId: targetUserId },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [{ userId: currentUserId }, { userId: targetUserId }],
          },
        },
      });
    }

    // Cria a mensagem vinculada ao Story
    const [createdMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: currentUserId,
          content: String(replyText).trim(),
          mediaUrl: story.mediaUrl,
          mediaType: 'STORY_REPLY',
        },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Emite evento via Socket.IO
    const members = await prisma.conversationMember.findMany({
      where: { conversationId: conversation.id },
      select: { userId: true },
    });
    const memberIds = members.map((m) => m.userId);

    emitChatMessage(conversation.id, createdMessage, memberIds);

    return res.status(201).json({
      success: true,
      message: 'Resposta enviada com sucesso no chat!',
      chatMessage: createdMessage,
    });
  } catch (error) {
    console.error('Erro ao responder story:', error);
    return res.status(500).json({ success: false, message: 'Erro ao responder story.' });
  }
}
