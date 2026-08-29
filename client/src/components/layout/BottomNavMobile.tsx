import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Film, PlusCircle, Heart, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';

interface BottomNavMobileProps {
  onOpenCreateModal: () => void;
}

export const BottomNavMobile: React.FC<BottomNavMobileProps> = ({ onOpenCreateModal }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadNotificationsCount } = useSocket();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#090d16]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800/80 px-3 py-2 flex items-center justify-around select-none">
      <Link
        to="/"
        className={`p-2 rounded-2xl flex flex-col items-center gap-0.5 transition-colors ${
          isActive('/') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Home className="w-6 h-6" />
      </Link>

      <Link
        to="/explore"
        className={`p-2 rounded-2xl flex flex-col items-center gap-0.5 transition-colors ${
          isActive('/explore') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Compass className="w-6 h-6" />
      </Link>

      {/* Botão de Criar Post Central em Destaque */}
      <button
        onClick={onOpenCreateModal}
        className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-brand-500/40 active:scale-95 transition-transform"
      >
        <PlusCircle className="w-7 h-7" />
      </button>

      <Link
        to="/clips"
        className={`p-2 rounded-2xl flex flex-col items-center gap-0.5 transition-colors ${
          isActive('/clips') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Film className="w-6 h-6" />
      </Link>

      <Link
        to={user ? `/profile/${user.username}` : '/login'}
        className={`p-1.5 rounded-2xl flex flex-col items-center gap-0.5 transition-colors ${
          isActive(`/profile/${user?.username}`)
            ? 'ring-2 ring-brand-500 rounded-full'
            : ''
        }`}
      >
        {user ? (
          <Avatar src={user.avatarUrl} name={user.displayName} size="xs" />
        ) : (
          <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
        )}
      </Link>
    </nav>
  );
};
