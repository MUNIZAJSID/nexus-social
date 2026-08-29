import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from './Avatar';
import { X, Heart, MessageSquare, UserPlus, Bell } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useSocket();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE_POST':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'COMMENT_POST':
      case 'REPLY_COMMENT':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'FOLLOW':
      case 'FOLLOW_REQUEST':
      case 'FOLLOW_ACCEPT':
        return <UserPlus className="w-4 h-4 text-brand-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-500" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 backdrop-blur-md rounded-2xl shadow-xl p-3.5 flex items-center gap-3 animate-slide-up"
        >
          <div className="relative">
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
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
