import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Copy,
  Film,
  Flame,
  Camera,
  Users,
  Compass,
  Play,
  ArrowLeft,
  Grid,
} from 'lucide-react';
import { SearchBar } from '../components/search/SearchBar';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Avatar } from '../components/ui/Avatar';
import { PostCard } from '../components/feed/PostCard';
import { api, getMediaUrl } from '../api/client';
import { Post } from '../types';

export const ExplorePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'photos' | 'creators'>('all');
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get('/posts/explore?limit=48'),
      api.get('/users/suggested'),
    ])
      .then(([postsRes, usersRes]) => {
        if (postsRes.data.success) {
          setPosts(postsRes.data.posts);
        }
        if (usersRes.data.success) {
          setSuggestedUsers(usersRes.data.suggestions || []);
        }
      })
      .catch((e) => console.error('Erro no explore:', e))
      .finally(() => setIsLoading(false));
  }, []);

  // Scroll automático até o post clicado quando abrir o modo feed
  useEffect(() => {
    if (viewMode === 'feed' && selectedPostId) {
      setTimeout(() => {
        const el = document.getElementById(`explore-post-${selectedPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [viewMode, selectedPostId]);

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'videos') return p.media.some((m) => m.mediaType === 'VIDEO');
    if (activeTab === 'photos') return p.media.every((m) => m.mediaType === 'IMAGE');
    return true;
  });

  const handleOpenPostFeed = (postId: string) => {
    setSelectedPostId(postId);
    setViewMode('feed');
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full select-none">
      {/* Modo Feed Contínuo (Estilo Instagram / Perfil: Rola para baixo através de todos os posts) */}
      {viewMode === 'feed' ? (
        <div className="max-w-xl mx-auto w-full flex flex-col gap-5">
          {/* Barra Superior de Navegação do Feed */}
          <div className="sticky top-0 z-30 bg-slate-50/90 dark:bg-[#090d16]/90 backdrop-blur-md py-3 px-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Explorar</span>
            </button>

            <div className="flex flex-col items-center">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                Explorar Feed
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {activeTab === 'videos' ? '🎬 Vídeos & Clips' : activeTab === 'photos' ? '📸 Fotos' : '🔥 Em Alta'}
              </span>
            </div>

            <button
              onClick={() => setViewMode('grid')}
              className="p-2 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand-500 transition-colors cursor-pointer"
              title="Voltar para grade"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Lista Contínua de Todos os Posts com Scroll Infinito para Baixo */}
          <div className="flex flex-col gap-6">
            {filteredPosts.map((post) => (
              <div key={post.id} id={`explore-post-${post.id}`}>
                <PostCard
                  post={post}
                  onPostDeleted={(deletedId) => {
                    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Modo Grade Normal de Exploração */
        <>
          {/* Top Search bar */}
          <div className="max-w-xl mx-auto w-full">
            <SearchBar />
          </div>

          {/* Tabs Filter */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white'
                  : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>🔥 Em Alta</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white'
                  : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Film className="w-4 h-4 text-pink-400" />
              <span>🎬 Vídeos & Clips</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                activeTab === 'photos'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white'
                  : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Camera className="w-4 h-4 text-teal-400" />
              <span>📸 Fotos</span>
            </button>

            <button
              onClick={() => setActiveTab('creators')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                activeTab === 'creators'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white'
                  : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>⭐ Criadores</span>
            </button>
          </div>

          {/* Criadores em Destaque */}
          {activeTab === 'creators' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {suggestedUsers.map((su) => (
                <div
                  key={su.id}
                  className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <Link to={`/profile/${su.username}`}>
                    <Avatar src={su.avatarUrl} name={su.displayName} size="xl" />
                  </Link>

                  <div className="min-w-0">
                    <Link
                      to={`/profile/${su.username}`}
                      className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline flex items-center justify-center gap-1"
                    >
                      <span>{su.displayName}</span>
                      {su.isVerified && <VerifiedBadge size="xs" />}
                    </Link>
                    <p className="text-xs text-slate-400">@{su.username}</p>
                    {su.bio && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                        {su.bio}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/profile/${su.username}`}
                    className="w-full mt-2 py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors text-center"
                  >
                    Ver Perfil
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Grid Mosaico de Publicações */}
          {activeTab !== 'creators' && (
            <>
              {isLoading ? (
                <div className="grid grid-cols-3 gap-1 sm:gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-slate-200 dark:bg-slate-800/60 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800">
                  <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhum post encontrado nesta categoria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {filteredPosts.map((post) => {
                    const firstMedia = post.media[0];
                    const isVideo = firstMedia?.mediaType === 'VIDEO';
                    const hasMultiple = post.media.length > 1;

                    return (
                      <div
                        key={post.id}
                        onClick={() => handleOpenPostFeed(post.id)}
                        onMouseEnter={() => isVideo && setHoveredVideoId(post.id)}
                        onMouseLeave={() => isVideo && setHoveredVideoId(null)}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 group cursor-pointer border border-slate-200 dark:border-slate-800/60 shadow-sm"
                      >
                        {isVideo ? (
                          <video
                            src={getMediaUrl(firstMedia.url)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            muted
                            loop
                            playsInline
                            autoPlay={hoveredVideoId === post.id}
                          />
                        ) : (
                          <img
                            src={getMediaUrl(firstMedia?.url)}
                            alt={post.caption || 'Publicação'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                        )}

                        {/* Indicador de Vídeo no canto superior */}
                        {isVideo && (
                          <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white shadow-md">
                            <Play className="w-3 h-3 fill-white" />
                          </div>
                        )}

                        {hasMultiple && !isVideo && (
                          <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white shadow-md">
                            <Copy className="w-3 h-3" />
                          </div>
                        )}

                        {/* Overlay Escuro com Curtidas e Comentários no Hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white z-20">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Heart className="w-4 h-4 fill-white" />
                            <span>{post.likesCount}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <MessageCircle className="w-4 h-4 fill-white" />
                            <span>{post.commentsCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
