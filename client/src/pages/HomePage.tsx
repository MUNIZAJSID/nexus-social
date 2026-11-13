import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PostCard } from '../components/feed/PostCard';
import { StoriesBar } from '../components/feed/StoriesBar';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { SearchBar } from '../components/search/SearchBar';
import { Sparkles, RefreshCw, Compass, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { Post } from '../types';

export const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    setError('');

    try {
      const res = await api.get(`/posts/feed?page=${pageNum}&limit=12`);
      if (res.data.success) {
        if (pageNum === 1) {
          setPosts(res.data.posts);
        } else {
          setPosts((prev) => [...prev, ...res.data.posts]);
        }
        setHasMore(res.data.hasMore);
        setPage(pageNum);
      }
    } catch (e) {
      console.error('Erro ao carregar feed:', e);
      if (pageNum === 1) {
        setError('Não foi possível carregar o feed agora. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);
    const handlePostCreated = () => fetchFeed(1, true);
    window.addEventListener('post_created', handlePostCreated);
    return () => window.removeEventListener('post_created', handlePostCreated);
  }, [fetchFeed]);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      {/* Top Search bar */}
      <div className="flex items-center justify-between gap-3">
        <SearchBar />
        <button
          onClick={() => fetchFeed(1, true)}
          disabled={isRefreshing}
          className="p-2.5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors shadow-sm"
          title="Atualizar Feed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-500' : ''}`} />
        </button>
      </div>

      {/* Stories Bar */}
      <StoriesBar />

      {/* Feed Posts */}
      <div className="flex flex-col">
        {isLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : error && posts.length === 0 ? (
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{error}</p>
            <button
              onClick={() => fetchFeed(1)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Seu feed está pronto para novidades!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Siga outros criadores na rede ou publique seu primeiro momento.
            </p>
            <Link
              to="/explore"
              className="mt-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-brand-500/20"
            >
              <Compass className="w-4 h-4" />
              <span>Explorar Criadores</span>
            </Link>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
            />
          ))
        )}

        {hasMore && !isLoading && posts.length > 0 && (
          <button
            onClick={() => fetchFeed(page + 1)}
            disabled={isLoadingMore}
            className="w-full py-3.5 my-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin text-brand-500" />}
            <span>{isLoadingMore ? 'Carregando...' : 'Carregar mais publicações'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
