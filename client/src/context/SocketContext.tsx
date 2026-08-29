import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { initializeSocket, disconnectSocket, getSocket } from '../api/socket';
import { api } from '../api/client';
import { Notification } from '../types';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  avatarUrl?: string | null;
  type: string;
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

  useEffect(() => {
    if (isAuthenticated && token) {
      const s = initializeSocket(token);
      setSocket(s);

      s.on('online_users', (userIds: string[]) => {
        setOnlineUsers(userIds);
      });

      s.on('new_notification', (notif: Notification) => {
        setUnreadNotificationsCount((prev) => prev + 1);

        // Gera Toast Notification
        let title = 'Nova Notificação';
        let msg = '';
        if (notif.type === 'FOLLOW') {
          title = 'Novo Seguidor';
          msg = `@${notif.actor.username} começou a seguir você!`;
        } else if (notif.type === 'FOLLOW_REQUEST') {
          title = 'Solicitação para Seguir';
          msg = `@${notif.actor.username} solicitou seguir seu perfil.`;
        } else if (notif.type === 'FOLLOW_ACCEPT') {
          title = 'Solicitação Aceita';
          msg = `@${notif.actor.username} aceitou sua solicitação.`;
        } else if (notif.type === 'LIKE_POST') {
          title = 'Nova Curtida';
          msg = `@${notif.actor.username} curtiu sua publicação.`;
        } else if (notif.type === 'COMMENT_POST') {
          title = 'Novo Comentário';
          msg = `@${notif.actor.username} comentou na sua foto.`;
        } else if (notif.type === 'REPLY_COMMENT') {
          title = 'Nova Resposta';
          msg = `@${notif.actor.username} respondeu ao seu comentário.`;
        }

        const newToast: ToastNotification = {
          id: Math.random().toString(36).substring(7),
          title,
          message: msg,
          avatarUrl: notif.actor.avatarUrl,
          type: notif.type,
        };

        setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

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
  }, [isAuthenticated, token, refreshUnreadCount, removeToast]);

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
