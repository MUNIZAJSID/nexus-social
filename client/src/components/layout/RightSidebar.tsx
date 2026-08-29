import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Sparkles, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { api } from '../../api/client';
import { User } from '../../types';

export const RightSidebar: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  const [serverInfo, setServerInfo] = useState<{ host: string; status: string }>({
    host: typeof window !== 'undefined' ? window.location.host : 'localhost:3000',
    status: 'online',
  });

  useEffect(() => {
    if (user) {
      api.get('/users/suggestions')
        .then((res) => {
          if (res.data.success) {
            setSuggestions(res.data.suggestions);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleFollowToggle = async (targetId: string) => {
    try {
      const res = await api.post(`/follow/${targetId}`);
      if (res.data.success) {
        setFollowingStates((prev) => ({
          ...prev,
          [targetId]: res.data.action === 'FOLLOWED' || res.data.action === 'REQUESTED',
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 h-screen sticky top-0 px-6 py-8 gap-6 select-none overflow-y-auto no-scrollbar">
      {/* Current User Card */}
      {user && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
          <Link to={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0">
            <Avatar src={user.avatarUrl} name={user.displayName} size="md" isOnline={true} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                @{user.username}
              </p>
            </div>
          </Link>
          <Link
            to={`/profile/${user.username}`}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Ver
          </Link>
        </div>
      )}

      {/* Suggested Users */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sugestões para você</span>
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {suggestions.map((sug) => {
              const isFollowed = followingStates[sug.id];
              return (
                <div
                  key={sug.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Link to={`/profile/${sug.username}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Avatar src={sug.avatarUrl} name={sug.displayName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {sug.displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        @{sug.username}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleFollowToggle(sug.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isFollowed
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-brand-600 hover:bg-brand-500 text-white'
                    }`}
                  >
                    {isFollowed ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" /> Seguindo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserPlus className="w-3 h-3" /> Seguir
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Network Server Info Card */}
      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-4 h-4" />
          <span>Servidor Local Ativo</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
          Este nó está hospedado no seu computador. Outros celulares e PCs na mesma rede podem acessar em:
        </p>
        <div className="bg-black/50 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-brand-300 select-all truncate">
          http://{serverInfo.host}
        </div>
      </div>
    </aside>
  );
};
