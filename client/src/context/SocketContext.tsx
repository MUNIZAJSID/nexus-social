import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { initializeSocket, disconnectSocket, getSocket } from '../api/socket';
import { api } from '../api/client';
import type { Notification } from '../types';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  avatarUrl?: string | null;
  type: string;
  link?: string;
}

// Som agradável de notificação sintetizado via Web Audio API (sem precisar baixar arquivo MP3)
function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Tom suave: F5 -> A5
    osc.frequency.setValueAtTime(698.46, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch {
    // Audio context indisponível ou bloqueado por política de autoplay
  }
}

// Notificação nativa do sistema / navegador
function showBrowserNotification(title: string, body: string, icon?: string | null) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new window.Notification(title, {
        body,
        icon: icon || '/favicon.ico',
      });
    } catch {
      // Ignora erro de notificação nativa
    }
  }
}

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  isUserOnline: (userId: string) => boolean;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  emitTypingStart: (conversationId: string, username: string) => void;
  emitTypingStop: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data.success) {
        setUnreadNotificationsCount(res.data.unreadCount);
      }
    } catch (e) {
      // Ignora erro
    }
  }, [isAuthenticated]);

  // Solicita permissão para notificações nativas do navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      const s = initializeSocket(token);
      setSocket(s);

      s.on('online_users', (userIds: string[]) => {
        setOnlineUsers(userIds);
      });

      s.on('new_notification', (notif: Notification) => {
        setUnreadNotificationsCount((prev) => prev + 1);
        playNotificationSound();

        // Gera Toast Notification
        let title = 'Nova Notificação';
        let msg = '';
        let link: string | undefined = undefined;

        if (notif.type === 'FOLLOW') {
          title = 'Novo Seguidor';
          msg = `@${notif.actor.username} começou a seguir você!`;
          link = `/profile/${notif.actor.username}`;
        } else if (notif.type === 'FOLLOW_REQUEST') {
          title = 'Solicitação para Seguir';
          msg = `@${notif.actor.username} solicitou seguir seu perfil.`;
          link = '/notifications';
        } else if (notif.type === 'FOLLOW_ACCEPT') {
          title = 'Solicitação Aceita';
          msg = `@${notif.actor.username} aceitou sua solicitação.`;
          link = `/profile/${notif.actor.username}`;
        } else if (notif.type === 'LIKE_POST') {
          title = 'Nova Curtida';
          msg = `@${notif.actor.username} curtiu sua publicação.`;
          link = notif.entityId ? `/post/${notif.entityId}` : undefined;
        } else if (notif.type === 'COMMENT_POST') {
          title = 'Novo Comentário';
          msg = `@${notif.actor.username} comentou no seu post.`;
          link = notif.entityId ? `/post/${notif.entityId}` : undefined;
        } else if (notif.type === 'REPLY_COMMENT') {
          title = 'Nova Resposta';
          msg = `@${notif.actor.username} respondeu ao seu comentário.`;
          link = notif.entityId ? `/post/${notif.entityId}` : undefined;
        } else if (notif.type === 'NEW_POST') {
          title = 'Nova Publicação';
          msg = `@${notif.actor.username} publicou uma nova foto ou vídeo!`;
          link = notif.entityId ? `/post/${notif.entityId}` : undefined;
        } else if (notif.type === 'NEW_STORY') {
          title = 'Novo Story';
          msg = `@${notif.actor.username} acabou de postar um story!`;
          link = '/';
        }

        showBrowserNotification(title, msg, notif.actor.avatarUrl);

        const newToast: ToastNotification = {
          id: Math.random().toString(36).substring(7),
          title,
          message: msg,
          avatarUrl: notif.actor.avatarUrl,
          type: notif.type,
          link,
        };

        setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

        setTimeout(() => {
          removeToast(newToast.id);
        }, 5000);
      });

      // Notificação de novas mensagens no chat
      s.on('conversation_updated', ({ conversationId, lastMessage }: any) => {
        if (!lastMessage || lastMessage.senderId === user?.id) return;

        playNotificationSound();
        const senderName = lastMessage.sender?.displayName || `@${lastMessage.sender?.username || 'Usuário'}`;
        const messagePreview = lastMessage.content || (lastMessage.mediaType === 'IMAGE' ? '📷 Foto' : lastMessage.mediaType === 'VIDEO' ? '🎥 Vídeo' : '🎵 Áudio');

        showBrowserNotification(`Mensagem de ${senderName}`, messagePreview, lastMessage.sender?.avatarUrl);

        const newToast: ToastNotification = {
          id: Math.random().toString(36).substring(7),
          title: `Mensagem de ${senderName}`,
          message: messagePreview,
          avatarUrl: lastMessage.sender?.avatarUrl,
          type: 'NEW_MESSAGE',
          link: '/direct',
        };

        setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

        setTimeout(() => {
          removeToast(newToast.id);
        }, 5000);
      });

      refreshUnreadCount();

      return () => {
        disconnectSocket();
        setSocket(null);
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setOnlineUsers([]);
    }
  }, [isAuthenticated, token, user?.id, refreshUnreadCount, removeToast]);

  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  const joinConversation = (conversationId: string) => {
    socket?.emit('join_conversation', conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socket?.emit('leave_conversation', conversationId);
  };

  const emitTypingStart = (conversationId: string, username: string) => {
    socket?.emit('typing_start', { conversationId, username });
  };

  const emitTypingStop = (conversationId: string) => {
    socket?.emit('typing_stop', { conversationId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isUserOnline,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        refreshUnreadCount,
        toasts,
        removeToast,
        joinConversation,
        leaveConversation,
        emitTypingStart,
        emitTypingStop,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
