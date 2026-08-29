import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  UserPlus,
  Check,
  MapPin,
  Flame,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { CommentSection } from '../components/feed/CommentSection';
import { ShareModal } from '../components/feed/ShareModal';
import { useAuth } from '../context/AuthContext';
import { api, getMediaUrl } from '../api/client';
import { Clip, Post } from '../types';

export const ClipsPage: React.FC = () => {
  const { user } = useAuth();
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [activeCommentClipId, setActiveCommentClipId] = useState<string | null>(null);
  const [shareClip, setShareClip] = useState<Clip | null>(null);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  const [likesStates, setLikesStates] = useState<{ [key: string]: { liked: boolean; count: number } }>({});
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const fetchClips = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/clips?limit=20');
      if (res.data.success) {
        setClips(res.data.clips);
        const lStates: any = {};
        res.data.clips.forEach((c: Clip) => {
          lStates[c.id] = { liked: !!c.isLiked, count: c.likesCount || 0 };
        });
        setLikesStates(lStates);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, []);

  // Intersection observer para tocar apenas o vídeo centralizado na tela
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const height = containerRef.current.clientHeight;
      const scrollTop = containerRef.current.scrollTop;
      const idx = Math.round(scrollTop / height);
      if (idx !== currentIdx && idx >= 0 && idx < clips.length) {
        setCurrentIdx(idx);
        // Notifica visualização
        const clip = clips[idx];
        if (clip) {
          api.post(`/clips/${clip.id}/view`).catch(() => {});
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentIdx, clips]);

  useEffect(() => {
    // Toca o vídeo ativo e pausa os outros
    clips.forEach((clip, idx) => {
      const video = videoRefs.current[clip.id];
      if (video) {
        if (idx === currentIdx) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIdx, clips]);

  const handleLike = async (clipId: string) => {
    if (!user) return;
    const current = likesStates[clipId] || { liked: false, count: 0 };
    const newLiked = !current.liked;
    const newCount = newLiked ? current.count + 1 : Math.max(0, current.count - 1);

    setLikesStates((prev) => ({
      ...prev,
      [clipId]: { liked: newLiked, count: newCount },
    }));

    try {
      const res = await api.post(`/likes/post/${clipId}`);
      if (res.data.success) {
        setLikesStates((prev) => ({
          ...prev,
          [clipId]: { liked: res.data.isLiked, count: res.data.likesCount },
        }));
      }
    } catch (e) {
      setLikesStates((prev) => ({ ...prev, [clipId]: current }));
    }
  };

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
    <div className="flex items-center justify-center h-[calc(100vh-5rem)] md:h-[calc(100vh-3rem)] w-full select-none">
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Carregando Clips...</p>
        </div>
      ) : clips.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm">
          <Flame className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Nenhum vídeo no feed</h3>
          <p className="text-xs text-slate-500 mt-1">Publique o primeiro vídeo para inaugurar os Clips!</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-black relative"
        >
          {clips.map((clip) => {
            const isFollowed = followingStates[clip.user.id];
            const isLiked = likesStates[clip.id]?.liked;
            const likeCount = likesStates[clip.id]?.count || 0;

            return (
              <div
                key={clip.id}
                className="relative w-full h-full snap-start flex items-center justify-center bg-black overflow-hidden"
              >
                {/* Vídeo */}
                <video
                  ref={(el) => (videoRefs.current[clip.id] = el)}
                  src={getMediaUrl(clip.videoUrl)}
                  className="w-full h-full object-cover cursor-pointer"
                  loop
                  muted={isMuted}
                  playsInline
                  onClick={() => setIsMuted(!isMuted)}
                />

                {/* Botão de Som Mute/Unmute */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute top-4 right-4 z-20 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Ações Flutuantes à Direita */}
                <div className="absolute right-4 bottom-20 z-20 flex flex-col items-center gap-5 text-white drop-shadow-md">
                  {/* Like */}
                  <button
                    onClick={() => handleLike(clip.id)}
                    className="flex flex-col items-center gap-1 group active:scale-125 transition-transform"
                  >
                    <div
                      className={`p-3 rounded-full backdrop-blur-md transition-colors ${
                        isLiked ? 'bg-rose-500 text-white' : 'bg-black/50 hover:bg-black/75'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${isLiked ? 'fill-white' : ''}`} />
                    </div>
                    <span className="text-xs font-bold">{likeCount}</span>
                  </button>

                  {/* Comentários */}
                  <button
                    onClick={() =>
                      setActiveCommentClipId(activeCommentClipId === clip.id ? null : clip.id)
                    }
                    className="flex flex-col items-center gap-1 group active:scale-110 transition-transform"
                  >
                    <div className="p-3 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold">{clip.commentsCount || 0}</span>
                  </button>

                  {/* Compartilhar */}
                  <button
                    onClick={() => setShareClip(clip)}
                    className="flex flex-col items-center gap-1 group active:scale-110 transition-transform"
                  >
                    <div className="p-3 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md">
                      <Share2 className="w-6 h-6" />
                    </div>
                  </button>
                </div>

                {/* Informações do Criador e Legenda no Rodapé */}
                <div className="absolute bottom-4 left-4 right-16 z-20 flex flex-col gap-2 text-white drop-shadow-md">
                  <div className="flex items-center gap-2.5">
                    <Link to={`/profile/${clip.user.username}`}>
                      <Avatar src={clip.user.avatarUrl} name={clip.user.displayName} size="sm" />
                    </Link>
                    <Link
                      to={`/profile/${clip.user.username}`}
                      className="font-bold text-xs hover:underline flex items-center gap-1"
                    >
                      <span>@{clip.user.username}</span>
                      {clip.user.isVerified && <VerifiedBadge size="xs" />}
                    </Link>

                    {user?.id !== clip.user.id && (
                      <button
                        onClick={() => handleFollowToggle(clip.user.id)}
                        className={`ml-2 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md transition-all ${
                          isFollowed
                            ? 'bg-white/20 text-white'
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
                    )}
                  </div>

                  {clip.caption && (
                    <p className="text-xs text-white/90 leading-relaxed line-clamp-2">
                      {clip.caption}
                    </p>
                  )}

                  {clip.location && (
                    <span className="text-[11px] text-white/70 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-400" />
                      {clip.location}
                    </span>
                  )}
                </div>

                {/* Gaveta de Comentários do Clip */}
                {activeCommentClipId === clip.id && (
                  <div className="absolute inset-x-0 bottom-0 top-1/3 bg-white dark:bg-[#0f172a] rounded-t-3xl z-30 p-4 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Comentários
                      </h4>
                      <button
                        onClick={() => setActiveCommentClipId(null)}
                        className="text-xs font-semibold text-slate-500"
                      >
                        Fechar
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pt-2">
                      <CommentSection postId={clip.id} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {shareClip && (
        <ShareModal
          isOpen={!!shareClip}
          onClose={() => setShareClip(null)}
          post={shareClip as unknown as Post}
        />
      )}
    </div>
  );
};
