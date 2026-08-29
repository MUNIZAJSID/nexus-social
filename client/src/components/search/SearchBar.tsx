import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, X, UserPlus, Check, Loader2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { User, Post } from '../../types';

export const SearchBar: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ users: User[]; posts: Post[] }>({ users: [], posts: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          if (res.data.success) {
            setResults({ users: res.data.users, posts: res.data.posts });
            const states: { [key: string]: boolean } = {};
            res.data.users.forEach((u: User) => {
              states[u.id] = !!u.isFollowing;
            });
            setFollowingStates(states);
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleFollow = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await api.post(`/follow/${targetId}`);
      if (res.data.success) {
        setFollowingStates((prev) => ({
          ...prev,
          [targetId]: res.data.action === 'FOLLOWED' || res.data.action === 'REQUESTED',
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg select-none">
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar pessoas, @usuários, tags..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults({ users: [], posts: [] });
            }}
            className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de Resultados */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-40 max-h-96 overflow-y-auto animate-slide-up">
          {isLoading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              <span>Buscando na rede local...</span>
            </div>
          ) : results.users.length === 0 && results.posts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Usuários */}
              {results.users.length > 0 && (
                <div className="p-2">
                  <span className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 block">
                    Pessoas ({results.users.length})
                  </span>
                  <div className="flex flex-col gap-1 mt-1">
                    {results.users.map((u) => {
                      const isFollowing = followingStates[u.id];
                      const isSelf = currentUser?.id === u.id;

                      return (
                        <Link
                          key={u.id}
                          to={`/profile/${u.username}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {u.displayName}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                @{u.username}
                              </p>
                            </div>
                          </div>

                          {currentUser && !isSelf && (
                            <button
                              onClick={(e) => handleToggleFollow(u.id, e)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isFollowing
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  : 'bg-brand-600 text-white'
                              }`}
                            >
                              {isFollowing ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Seguindo
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <UserPlus className="w-3 h-3" /> Seguir
                                </span>
                              )}
                            </button>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
