import { Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { emitChatMessage, isUserOnline } from '../socket/socket.handler';

export async function getConversations(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;

  const members = await prisma.conversationMember.findMany({
    where: { userId: currentUserId },
    include: {
      conversation: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: { select: { id: true, username: true, displayName: true } },
            },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  });

  const formattedConversations = await Promise.all(
    members.map(async (m) => {
      const conv = m.conversation;
      const otherMembers = conv.members
        .filter((member) => member.userId !== currentUserId)
        .map((member) => ({
          ...member.user,
          isOnline: isUserOnline(member.user.id),
        }));

      const lastMessage = conv.messages[0] || null;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: currentUserId },
          createdAt: { gt: m.lastReadAt || new Date(0) },
        },
      });

      return {
        id: conv.id,
        isGroup: conv.isGroup,
        name: conv.name,
        updatedAt: conv.updatedAt,
        otherMembers,
        lastMessage,
        unreadCount,
      };
    })
  );

  return res.json({ success: true, conversations: formattedConversations });
}

export async function getOrCreateDirectConversation(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const targetUserId = String(req.params.targetUserId || '');

  if (currentUserId === targetUserId) {
    return res.status(400).json({ success: false, message: 'Você não pode criar uma conversa consigo mesmo.' });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  });

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Usuário destinatário não encontrado.' });
  }

  const myConversations = await prisma.conversationMember.findMany({
    where: { userId: currentUserId },
    select: { conversationId: true },
  });

  const myConvIds = myConversations.map((c) => c.conversationId);

  const existingDirect = await prisma.conversation.findFirst({
    where: {
      id: { in: myConvIds },
      isGroup: false,
      members: {
        some: { userId: targetUserId },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (existingDirect) {
    const otherMembers = existingDirect.members
      .filter((m) => m.userId !== currentUserId)
      .map((m) => ({ ...m.user, isOnline: isUserOnline(m.user.id) }));

    return res.json({
      success: true,
      conversation: {
        id: existingDirect.id,
        isGroup: false,
        name: existingDirect.name,
        otherMembers,
      },
    });
  }

  const newConversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [{ userId: currentUserId }, { userId: targetUserId }],
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  const otherMembers = newConversation.members
    .filter((m) => m.userId !== currentUserId)
    .map((m) => ({ ...m.user, isOnline: isUserOnline(m.user.id) }));

  return res.status(201).json({
    success: true,
    conversation: {
      id: newConversation.id,
      isGroup: false,
      name: newConversation.name,
      otherMembers,
    },
  });
}

export async function getMessages(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const conversationId = String(req.params.conversationId || '');
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '50'), 10);
  const skip = (page - 1) * limit;

  const isMember = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: currentUserId,
      },
    },
  });

  if (!isMember && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Você não tem acesso a esta conversa.' });
  }

  if (isMember) {
    await prisma.conversationMember.update({
      where: { id: isMember.id },
      data: { lastReadAt: new Date() },
    });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  return res.json({
    success: true,
    messages: messages.reverse(),
  });
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const conversationId = String(req.params.conversationId || '');
  const content = (req.body.content || '').trim();
  const file = req.file;

  if (!content && !file) {
    return res.status(400).json({ success: false, message: 'A mensagem não pode ficar vazia.' });
  }

  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: currentUserId,
      },
    },
  });

  if (!membership) {
    return res.status(403).json({ success: false, message: 'Você não pertence a esta conversa.' });
  }

  let mediaUrl: string | null = null;
  let mediaType = 'TEXT';

  if (file) {
    mediaUrl = `/storage/chat/${file.filename}`;
    if (file.mimetype.startsWith('audio/')) {
      mediaType = 'AUDIO';
    } else if (file.mimetype.startsWith('video/')) {
      mediaType = 'VIDEO';
    } else {
      mediaType = 'IMAGE';
    }
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: currentUserId,
        content: content || null,
        mediaUrl,
        mediaType,
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  const members = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);

  emitChatMessage(conversationId, message, memberIds);

  return res.status(201).json({
    success: true,
    message,
  });
}

export async function markConversationAsRead(req: AuthRequest, res: Response) {
  const currentUserId = req.user!.id;
  const conversationId = String(req.params.conversationId || '');

  await prisma.conversationMember.updateMany({
    where: {
      conversationId,
      userId: currentUserId,
    },
    data: { lastReadAt: new Date() },
  });

  return res.json({ success: true, message: 'Conversa marcada como lida.' });
}
