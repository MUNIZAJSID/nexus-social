import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Heart,
  MessageSquare,
  UserPlus,
  Check,
  X,
  CheckCheck,
  ShieldAlert,
  ImagePlus,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { api } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { Notification, FollowRequest } from '../../types';

export const NotificationList: React.FC = () => {
  const { refreshUnreadCount, setUnreadNotificationsCount } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [notifRes, reqRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/follow/requests/pending'),
      ]);

      if (notifRes.data.success) {
        setNotifications(notifRes.data.notifications);
      }
      if (reqRes.data.success) {
        setPendingRequests(reqRes.data.requests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.post('/notifications/read-all');
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadNotificationsCount(0);
        refreshUnreadCount();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const res = await api.post(`/follow/requests/${requestId}/respond`, { action });
      if (res.data.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        refreshUnreadCount();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE_POST':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case 'COMMENT_POST':
      case 'REPLY_COMMENT':
        return <MessageSquare className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />;
      case 'FOLLOW':
      case 'FOLLOW_ACCEPT':
        return <UserPlus className="w-3.5 h-3.5 text-brand-500" />;
      case 'FOLLOW_REQUEST':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />;
      case 'NEW_POST':
        return <ImagePlus className="w-3.5 h-3.5 text-purple-500" />;
      case 'NEW_STORY':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />;
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />;
      default:
        return <Heart className="w-3.5 h-3.5 text-brand-500" />;
    }
  };

  const getText = (notif: Notification) => {
    switch (notif.type) {
      case 'LIKE_POST':
        return 'curtiu sua publicação.';
      case 'COMMENT_POST':
        return 'comentou na sua foto.';
      case 'REPLY_COMMENT':
        return 'respondeu ao seu comentário.';
      case 'FOLLOW':
        return 'começou a seguir você.';
      case 'FOLLOW_REQUEST':
        return 'enviou uma solicitação para seguir seu perfil privado.';
      case 'FOLLOW_ACCEPT':
        return 'aceitou sua solicitação para seguir.';
      case 'NEW_POST':
        return 'publicou uma nova foto ou vídeo.';
      case 'NEW_STORY':
        return 'adicionou um novo story.';
      case 'NEW_MESSAGE':
        return 'enviou uma nova mensagem no bate-papo.';
      default:
        return 'interagiu com você.';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          Notificações
        </h1>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Marcar todas como lidas</span>
          </button>
        )}
      </div>

      {/* Solicitações de seguir pendentes */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Solicitações de Seguir ({pendingRequests.length})
          </h3>
          <div className="flex flex-col gap-2.5">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-2.5 bg-white/70 dark:bg-slate-900/80 rounded-2xl border border-amber-500/20"
              >
                <Link
                  to={`/profile/${req.requester.username}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Avatar src={req.requester.avatarUrl} name={req.requester.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {req.requester.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      @{req.requester.username}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRespondRequest(req.id, 'ACCEPT')}
                  >
                    <Check className="w-3.5 h-3.5" /> Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRespondRequest(req.id, 'REJECT')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista Geral de Notificações */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-sm">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-10">Carregando notificações...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Você ainda não tem notificações no momento.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                !notif.isRead ? 'bg-brand-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative">
                  <Link to={`/profile/${notif.actor.username}`}>
                    <Avatar
                      src={notif.actor.avatarUrl}
                      name={notif.actor.displayName}
                      size="md"
                    />
                  </Link>
                  <span className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                    {getIcon(notif.type)}
                  </span>
                </div>

                <div className="text-xs leading-relaxed min-w-0">
                  <p className="text-slate-800 dark:text-slate-200">
                    <Link
                      to={`/profile/${notif.actor.username}`}
                      className="font-bold text-slate-900 dark:text-slate-100 hover:underline mr-1"
                    >
                      @{notif.actor.username}
                    </Link>
                    <span>{getText(notif)}</span>
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              {notif.entityId && notif.type.includes('POST') && (
                <Link
                  to={`/post/${notif.entityId}`}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline whitespace-nowrap px-2.5 py-1 rounded-lg hover:bg-brand-500/10"
                >
                  Ver Post
                </Link>
              )}

              {notif.type === 'NEW_STORY' && (
                <Link
                  to="/"
                  className="text-xs font-bold text-pink-500 hover:underline whitespace-nowrap px-2.5 py-1 rounded-lg hover:bg-pink-500/10"
                >
                  Ver Story
                </Link>
              )}

              {notif.type === 'NEW_MESSAGE' && (
                <Link
                  to="/direct"
                  className="text-xs font-bold text-emerald-500 hover:underline whitespace-nowrap px-2.5 py-1 rounded-lg hover:bg-emerald-500/10"
                >
                  Abrir Chat
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
