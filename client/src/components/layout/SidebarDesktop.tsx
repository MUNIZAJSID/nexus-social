import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  Film,
  PlusSquare,
  MessageCircle,
  Heart,
  User as UserIcon,
  Shield,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface SidebarDesktopProps {
  onOpenCreateModal: () => void;
}

export const SidebarDesktop: React.FC<SidebarDesktopProps> = ({ onOpenCreateModal }) => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadNotificationsCount } = useSocket();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Início', icon: Home, path: '/' },
    { label: 'Explorar', icon: Compass, path: '/explore' },
    { label: 'Clips', icon: Film, path: '/clips', isHot: true },
    {
      label: 'Mensagens',
      icon: MessageCircle,
      path: '/chat',
    },
    {
      label: 'Notificações',
      icon: Heart,
      path: '/notifications',
      badge: unreadNotificationsCount,
    },
    {
      label: 'Perfil',
      icon: UserIcon,
      path: user ? `/profile/${user.username}` : '/login',
    },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Painel Admin', icon: Shield, path: '/admin' });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800/80 bg-white/75 dark:bg-[#090d16]/80 backdrop-blur-2xl px-4 py-6 justify-between z-30 select-none">
      <div className="flex flex-col gap-6">
        {/* Logo & Brand NEXUS */}
        <Link to="/" className="flex items-center gap-3 px-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-brand-500 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
              NEXUS
            </h1>
            <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">
              Social Universe
            </p>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-brand-600/15 to-indigo-600/10 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      active ? 'stroke-[2.5px] text-brand-500' : 'stroke-2'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.isHot && !active && (
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white animate-pulse">
                    HOT
                  </span>
                )}

                {item.badge && item.badge > 0 ? (
                  <span className="bg-rose-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full animate-bounce">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {/* Botão de Criar Publicação */}
          <button
            onClick={onOpenCreateModal}
            className="mt-3 flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-brand-600 via-indigo-600 to-pink-600 hover:opacity-95 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-xl shadow-brand-500/25 active:scale-[0.98] transition-all duration-200"
          >
            <PlusSquare className="w-5 h-5" />
            <span>Criar Publicação</span>
          </button>
        </nav>
      </div>

      {/* Footer Profile & Actions */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        {/* Toggle Theme */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{theme === 'dark' ? 'Modo Noturno' : 'Modo Diurno'}</span>
          </span>
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800">
            {theme}
          </span>
        </button>

        {/* User Card */}
        {user ? (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <Avatar src={user.avatarUrl} name={user.displayName} size="sm" isOnline={true} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.displayName}
                  </p>
                  {user.isVerified && <VerifiedBadge size="xs" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  @{user.username}
                </p>
              </div>
            </Link>

            <button
              onClick={logout}
              title="Encerrar Sessão"
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center w-full py-3 rounded-2xl text-xs font-bold bg-brand-600 text-white"
          >
            Entrar / Cadastrar
          </Link>
        )}
      </div>
    </aside>
  );
};
