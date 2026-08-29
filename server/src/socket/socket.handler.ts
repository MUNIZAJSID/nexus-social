import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../db/prisma';

let ioInstance: SocketIOServer | null = null;
// Mapeamento: userId -> Set de socketIds
const onlineUsers = new Map<string, Set<string>>();

export function initSocketServer(io: SocketIOServer) {
  ioInstance = io;

  // Middleware de autenticação do Socket
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        return next(new Error('Autenticação de socket necessária.'));
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true, isBlocked: true },
      });

      if (!user || user.isBlocked) {
        return next(new Error('Usuário inválido ou suspenso.'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Token de socket inválido ou expirado.'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.id;
    if (!userId) return;

    // Registra conexão do usuário
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Entra na sala pessoal do usuário para notificações privadas
    socket.join(`user:${userId}`);

    // Emite lista atualizada de usuários online para todos os conectados
    emitOnlineUsers();

    // Entrar em sala de conversa específica
    socket.on('join_conversation', (conversationId: string) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    // Sair de sala de conversa
    socket.on('leave_conversation', (conversationId: string) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Indicador de "digitando..."
    socket.on('typing_start', ({ conversationId, username }: { conversationId: string; username: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // ==========================================
    // SINALIZAÇÃO WEBRTC - CHAMADAS DE VÍDEO / VOZ
    // ==========================================
    socket.on('call_user', ({ toUserId, isVideo, callId, conversationId }: { toUserId: string; isVideo: boolean; callId: string; conversationId?: string }) => {
      io.to(`user:${toUserId}`).emit('incoming_call', {
        fromUser: socket.data.user,
        isVideo,
        callId,
        conversationId,
      });
    });

    socket.on('accept_call', ({ toUserId, callId }: { toUserId: string; callId: string }) => {
      io.to(`user:${toUserId}`).emit('call_accepted', {
        callId,
        fromUserId: userId,
      });
    });

    socket.on('reject_call', ({ toUserId, callId, reason }: { toUserId: string; callId: string; reason?: string }) => {
      io.to(`user:${toUserId}`).emit('call_rejected', {
        callId,
        fromUserId: userId,
        reason,
      });
    });

    socket.on('webrtc_signal', ({ toUserId, signal, callId }: { toUserId: string; signal: any; callId: string }) => {
      io.to(`user:${toUserId}`).emit('webrtc_signal', {
        fromUserId: userId,
        signal,
        callId,
      });
    });

    socket.on('end_call', ({ toUserId, callId }: { toUserId: string; callId: string }) => {
      if (toUserId) {
        io.to(`user:${toUserId}`).emit('call_ended', { callId, fromUserId: userId });
      }
    });

    // Desconexão
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
      emitOnlineUsers();
    });
  });

  function emitOnlineUsers() {
    if (!ioInstance) return;
    const onlineUserIds = Array.from(onlineUsers.keys());
    ioInstance.emit('online_users', onlineUserIds);
  }
}

/**
 * Retorna a instância ativa do Socket.IO
 */
export function getIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Envia uma notificação em tempo real para um usuário específico
 */
export function emitNotification(recipientId: string, notificationData: any) {
  if (!ioInstance) return;
  ioInstance.to(`user:${recipientId}`).emit('new_notification', notificationData);
}

/**
 * Envia uma mensagem de chat em tempo real
 */
export function emitChatMessage(conversationId: string, messageData: any, recipientIds: string[] = []) {
  if (!ioInstance) return;
  // Envia para quem está dentro da sala da conversa
  ioInstance.to(`conversation:${conversationId}`).emit('new_message', messageData);

  // Também envia para a sala pessoal de cada membro para atualizar preview da sidebar
  recipientIds.forEach((uid) => {
    ioInstance!.to(`user:${uid}`).emit('conversation_updated', {
      conversationId,
      lastMessage: messageData,
    });
  });
}

/**
 * Verifica se um usuário está online no momento
 */
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && (onlineUsers.get(userId)?.size || 0) > 0;
}
