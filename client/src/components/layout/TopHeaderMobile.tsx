import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MessageCircle, Moon, Sun, Shield, Heart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const TopHeaderMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAuth();
  const { unreadNotificationsCount } = useSocket();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/90 dark:bg-[#090d16]/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between">
      {/* Brand NEXUS */}
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-lg font-black tracking-tight bg-gradient-to-r from-brand-500 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
          NEXUS
        </span>
      </Link>

      {/* Top right actions */}
      <div className="flex items-center gap-1.5">
        {isAdmin && (
          <Link
            to="/admin"
            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            title="Painel Admin"
          >
            <Shield className="w-5 h-5 text-amber-500" />
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
        </button>

        <Link
          to="/notifications"
          className="relative p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          title="Notificações"
        >
          <Heart className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </Link>

        <Link
          to="/chat"
          className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          title="Mensagens"
        >
          <MessageCircle className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};
