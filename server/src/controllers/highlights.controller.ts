import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getUserHighlights(req: AuthRequest, res: Response) {
  const { userId } = req.params;

  try {
    const highlights = await prisma.highlight.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      highlights,
    });
  } catch (error) {
    console.error('Erro ao buscar destaques:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar destaques.' });
  }
}

export async function createHighlight(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { title, coverUrl, storyIds, customItems } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'O título do destaque é obrigatório.' });
  }

  try {
    let itemsToCreate: any[] = [];

    // Se passou storyIds de stories anteriores
    if (Array.isArray(storyIds) && storyIds.length > 0) {
      const stories = await prisma.story.findMany({
        where: {
          id: { in: storyIds },
          userId,
        },
      });

      itemsToCreate = stories.map((s, index) => ({
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        duration: s.duration || 10,
        musicTitle: s.musicTitle,
        musicArtist: s.musicArtist,
        musicCoverUrl: s.musicCoverUrl,
        musicAudioUrl: s.musicAudioUrl,
        musicStartTime: s.musicStartTime || 0,
        order: index,
      }));
    } else if (Array.isArray(customItems) && customItems.length > 0) {
      itemsToCreate = customItems.map((item, index) => ({
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType || 'IMAGE',
        caption: item.caption || null,
        duration: item.duration || 10,
        musicTitle: item.musicTitle || null,
        musicArtist: item.musicArtist || null,
        musicCoverUrl: item.musicCoverUrl || null,
        musicAudioUrl: item.musicAudioUrl || null,
        musicStartTime: item.musicStartTime || 0,
        order: index,
      }));
    }

    if (itemsToCreate.length === 0) {
      return res.status(400).json({ success: false, message: 'Selecione pelo menos um Story para o destaque.' });
    }

    const finalCoverUrl = coverUrl || itemsToCreate[0]?.mediaUrl || null;

    const highlight = await prisma.highlight.create({
      data: {
        userId,
        title: title.trim(),
        coverUrl: finalCoverUrl,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: { orderBy: { order: 'asc' } },
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Destaque criado com sucesso!',
      highlight,
    });
  } catch (error) {
    console.error('Erro ao criar destaque:', error);
    return res.status(500).json({ success: false, message: 'Erro ao criar destaque.' });
  }
}

export async function deleteHighlight(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const highlight = await prisma.highlight.findUnique({
      where: { id },
    });

    if (!highlight) {
      return res.status(404).json({ success: false, message: 'Destaque não encontrado.' });
    }

    if (highlight.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permissão negada.' });
    }

    await prisma.highlight.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Destaque removido com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao excluir destaque:', error);
    return res.status(500).json({ success: false, message: 'Erro ao excluir destaque.' });
  }
}
