import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Grid, Bookmark, Lock, Image, Film, Copy, ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileHeaderSkeleton } from '../components/ui/Skeleton';
import { PostCard } from '../components/feed/PostCard';
import { CreateHighlightModal } from '../components/profile/CreateHighlightModal';
import { HighlightViewerModal } from '../components/profile/HighlightViewerModal';
import { useAuth } from '../context/AuthContext';
import { api, getMediaUrl } from '../api/client';
import { User, Post, Highlight } from '../types';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [showCreateHighlightModal, setShowCreateHighlightModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivateLocked, setIsPrivateLocked] = useState(false);

  const fetchProfileAndPosts = async () => {
    if (!username) return;
    setIsLoading(true);
    setIsPrivateLocked(false);

    try {
      // 1. Perfil
      const profRes = await api.get(`/users/${username}`);
      if (profRes.data.success) {
        const u = profRes.data.profile;
        setProfile(u);
        fetchHighlights(u.id);
      }

      // 2. Posts
      const postsRes = await api.get(`/posts/user/${username}`);
      if (postsRes.data.success) {
        setPosts(postsRes.data.posts);
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.isPrivateLocked) {
        setIsPrivateLocked(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHighlights = async (userId: string) => {
    try {
      const res = await api.get(`/highlights/user/${userId}`);
      if (res.data.success) {
        setHighlights(res.data.highlights);
      }
    } catch (err) {
      console.error('Erro ao buscar destaques:', err);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts();
    setActiveTab('posts');
    setViewMode('grid');
  }, [username]);

  // Carrega posts salvos se for o próprio perfil e clicar na aba
  useEffect(() => {
    if (activeTab === 'saved' && profile?.id === currentUser?.id) {
      api.get('/posts/saved')
        .then((res) => {
          if (res.data.success) {
            setSavedPosts(res.data.posts);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [activeTab, profile?.id, currentUser?.id]);

  // Scroll automático até o post clicado quando abrir o modo feed
  useEffect(() => {
    if (viewMode === 'feed' && selectedPostId) {
      setTimeout(() => {
        const el = document.getElementById(`profile-post-${selectedPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [viewMode, selectedPostId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <ProfileHeaderSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Usuário não encontrado
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          O perfil @{username} não existe ou foi removido.
        </p>
      </div>
    );
  }

  const isSelf = currentUser?.id === profile.id;
  const currentPosts = activeTab === 'posts' ? posts : savedPosts;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Header do Perfil (oculto no modo feed para focar no conteúdo) */}
      {viewMode === 'grid' && (
        <ProfileHeader
          profile={profile}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}

      {/* SEÇÃO DE DESTAQUES (HIGHLIGHTS) */}
      {viewMode === 'grid' && !isPrivateLocked && (
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none select-none px-2 sm:px-0">
          {/* Botão Novo Destaque (se for o próprio perfil) */}
          {isSelf && (
            <div
              onClick={() => setShowCreateHighlightModal(true)}
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 group-hover:border-amber-500 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 transition-all group-hover:scale-105">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 group-hover:text-amber-500">
                Novo
              </span>
            </div>
          )}

          {/* Círculos de Destaques Existentes */}
          {highlights.map((hl) => (
            <div
              key={hl.id}
              onClick={() => setSelectedHighlight(hl)}
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-pink-500 to-indigo-500 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-white dark:border-slate-900">
                  {hl.coverUrl ? (
                    <img
                      src={getMediaUrl(hl.coverUrl)}
                      alt={hl.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-amber-400 font-bold text-xs">
                      {hl.title.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[70px] text-center">
                {hl.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Trava de perfil privado */}
      {isPrivateLocked ? (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Esta conta é privada
          </h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Siga este perfil para ver suas fotos e vídeos compartilhados.
          </p>
        </div>
      ) : (
        <>
          {/* Modo Feed Contínuo (Estilo Instagram ao clicar em um post) */}
          {viewMode === 'feed' ? (
            <div className="max-w-xl mx-auto w-full flex flex-col gap-5">
              {/* Barra Superior de Navegação do Feed */}
              <div className="sticky top-0 z-30 bg-slate-50/90 dark:bg-[#090d16]/90 backdrop-blur-md py-3 px-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para Grade</span>
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    Publicações
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    @{profile.username}
                  </span>
                </div>

                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand-500 transition-colors cursor-pointer"
                  title="Voltar para visualização em grade"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* Lista Contínua de Todos os Posts */}
              <div className="flex flex-col gap-6">
                {currentPosts.map((post) => (
                  <div key={post.id} id={`profile-post-${post.id}`}>
                    <PostCard
                      post={post}
                      onPostDeleted={(deletedId) => {
                        setPosts((prev) => prev.filter((p) => p.id !== deletedId));
                        setSavedPosts((prev) => prev.filter((p) => p.id !== deletedId));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Modo Grade Tradicional (3x3) */
            <>
              {/* Navegação de Abas */}
              <div className="flex items-center justify-center gap-8 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex items-center gap-2 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    activeTab === 'posts'
                      ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Publicações ({posts.length})</span>
                </button>

                {isSelf && (
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center gap-2 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      activeTab === 'saved'
                        ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Salvos ({savedPosts.length})</span>
                  </button>
                )}
              </div>

              {/* Grid 3x3 de Posts */}
              {currentPosts.length === 0 ? (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {activeTab === 'posts' ? 'Nenhuma publicação ainda' : 'Nenhum post salvo'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeTab === 'posts'
                      ? 'Quando fotos ou vídeos forem postados, eles aparecerão aqui.'
                      : 'Você ainda não salvou nenhuma publicação.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
                  {currentPosts.map((post) => {
                    const firstMedia = post.media?.[0];
                    const isVideo = firstMedia?.mediaType === 'VIDEO';
                    const isMulti = (post.media?.length || 0) > 1;

                    return (
                      <div
                        key={post.id}
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setViewMode('feed');
                        }}
                        className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-black select-none border border-slate-200 dark:border-slate-800/80 shadow-sm cursor-pointer"
                      >
                        {firstMedia ? (
                          isVideo ? (
                            <video
                              src={getMediaUrl(firstMedia.url)}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={getMediaUrl(firstMedia.url)}
                              alt={post.caption || 'Publicação'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          )
                        ) : null}

                        {/* Badges */}
                        {isVideo && (
                          <div className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 text-white rounded-xl">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                        {isMulti && (
                          <div className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 text-white rounded-xl">
                            <Copy className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modais de Destaques */}
      <CreateHighlightModal
        isOpen={showCreateHighlightModal}
        onClose={() => setShowCreateHighlightModal(false)}
        onHighlightCreated={() => {
          if (profile?.id) fetchHighlights(profile.id);
        }}
      />

      <HighlightViewerModal
        isOpen={Boolean(selectedHighlight)}
        highlight={selectedHighlight}
        isOwner={isSelf}
        onClose={() => setSelectedHighlight(null)}
        onHighlightDeleted={(deletedId) => {
          setHighlights((prev) => prev.filter((h) => h.id !== deletedId));
          setSelectedHighlight(null);
        }}
      />
    </div>
  );
};
