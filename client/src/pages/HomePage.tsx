import React, { useEffect, useState, useCallback } from 'react';
import { PostCard } from '../components/feed/PostCard';
import { StoriesBar } from '../components/feed/StoriesBar';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { SearchBar } from '../components/search/SearchBar';
import { Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Post } from '../types';

export const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else if (pageNum === 1) setIsLoading(true);

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
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);
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
            className="w-full py-3.5 my-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            Carregar mais publicações
          </button>
        )}
      </div>
    </div>
  );
};
