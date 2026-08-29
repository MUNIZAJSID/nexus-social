import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from './Avatar';
import {
  X,
  Heart,
  MessageSquare,
  UserPlus,
  Bell,
  ImagePlus,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useSocket();
  const navigate = useNavigate();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE_POST':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case 'COMMENT_POST':
      case 'REPLY_COMMENT':
        return <MessageSquare className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />;
      case 'FOLLOW':
      case 'FOLLOW_REQUEST':
      case 'FOLLOW_ACCEPT':
        return <UserPlus className="w-3.5 h-3.5 text-brand-500" />;
      case 'NEW_POST':
        return <ImagePlus className="w-3.5 h-3.5 text-purple-500" />;
      case 'NEW_STORY':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />;
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-brand-500" />;
    }
  };

  const handleToastClick = (toast: any) => {
    removeToast(toast.id);
    if (toast.link) {
      navigate(toast.link);
    } else if (toast.type === 'NEW_MESSAGE') {
      navigate('/direct');
    } else if (toast.type === 'NEW_STORY') {
      navigate('/');
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleToastClick(toast)}
          className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 backdrop-blur-md rounded-2xl shadow-xl p-3.5 flex items-center gap-3 animate-slide-up cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="relative flex-shrink-0">
            <Avatar src={toast.avatarUrl} size="sm" />
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
              {getIcon(toast.type)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{toast.title}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">{toast.message}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
