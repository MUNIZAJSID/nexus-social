import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MapPin,
  Volume2,
  VolumeX,
  Eye,
  Play,
  Pause,
  Maximize2,
  Film,
  Music,
  Disc,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { CommentSection } from './CommentSection';
import { ShareModal } from './ShareModal';
import { PostLikesModal } from './PostLikesModal';
import { api, getMediaUrl } from '../../api/client';
import { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user, isAdmin } = useAuth();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(!!post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isSaved, setIsSaved] = useState(!!post.isSaved);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  const mediaList = post.media || [];
  const hasMultipleMedia = mediaList.length > 1;
  const currentMedia = mediaList[currentMediaIndex];
  const isCurrentVideo = currentMedia?.mediaType === 'VIDEO';

  // Auto-play when visible in viewport
  useEffect(() => {
    if (!isCurrentVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } else if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [isCurrentVideo, currentMediaIndex]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    setShowPlayOverlay(true);
    setTimeout(() => setShowPlayOverlay(false), 700);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress || 0);
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const previousState = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousState);
    setLikesCount(previousState ? previousCount - 1 : previousCount + 1);

    try {
      const res = await api.post(`/likes/post/${post.id}`);
      if (res.data.success) {
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.likesCount);
      }
    } catch (e) {
      setIsLiked(previousState);
      setLikesCount(previousCount);
    }
  };

  const handleDoubleClickMedia = () => {
    if (!user) return;
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
    if (!isLiked) {
      handleLike();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);

    try {
      const res = await api.post(`/posts/${post.id}/save`);
      if (res.data.success) {
        setIsSaved(res.data.isSaved);
      }
    } catch (e) {
      setIsSaved(previousSaved);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Tem certeza de que deseja excluir esta publicação?')) return;

    try {
      const res = await api.delete(`/posts/${post.id}`);
      if (res.data.success) {
        onPostDeleted?.(post.id);
      }
    } catch (e) {
      console.error('Erro ao excluir post:', e);
    }
  };

  const togglePlayMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.musicAudioUrl) return;

    if (isPlayingMusic) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
      }
      setIsPlayingMusic(false);
    } else {
      if (!musicAudioRef.current) {
        const audio = new Audio(post.musicAudioUrl);
        audio.loop = true;
        audio.volume = 0.8;
        audio.onended = () => setIsPlayingMusic(false);
        musicAudioRef.current = audio;
      }
      musicAudioRef.current.play().catch(() => {});
      setIsPlayingMusic(true);
    }
  };

  useEffect(() => {
    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
    };
  }, []);

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const isOwner = user?.id === post.user.id;
  const canDelete = isOwner || isAdmin;

  return (
    <article
      ref={cardRef}
      className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm hover:shadow-md transition-shadow mb-6 overflow-hidden select-none"
    >
      {/* Header do Post */}
      <header className="flex items-center justify-between px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile/${post.user.username}`}>
            <Avatar
              src={post.user.avatarUrl}
              name={post.user.displayName}
              size="md"
            />
          </Link>
          <div className="min-w-0">
            <Link
              to={`/profile/${post.user.username}`}
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 hover:underline flex items-center gap-1.5 truncate"
            >
              <span>{post.user.displayName}</span>
              {post.user.isVerified && <VerifiedBadge size="xs" />}
              <span className="text-slate-400 font-normal text-xs">
                @{post.user.username}
              </span>
            </Link>
            {post.location && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                <MapPin className="w-3 h-3 text-brand-500" />
                <span>{post.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* Menu de Ações */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-20 animate-fade-in">
              <Link
                to={`/post/${post.id}`}
                className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Abrir publicação
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowShareModal(true);
                }}
                className="flex items-center w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Compartilhar
              </button>
              {canDelete && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDeletePost();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Trilha Sonora / Música do Post (Estilo Instagram) */}
      {post.musicTitle && (
        <div className="px-4 pb-2.5 sm:px-5 -mt-1 flex items-center">
          <div
            onClick={togglePlayMusic}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer max-w-full min-w-0 shadow-sm border border-slate-200/60 dark:border-slate-700/50 group"
          >
            <div className={`relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-slate-700 ${
              isPlayingMusic ? 'animate-spin-slow' : ''
            }`}>
              {post.musicCoverUrl ? (
                <img src={post.musicCoverUrl} alt={post.musicTitle} className="w-full h-full object-cover" />
              ) : (
                <Disc className="w-4 h-4 text-pink-500" />
              )}
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <Music className="w-3 h-3 text-pink-500 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                {post.musicTitle} • {post.musicArtist}
              </span>
            </div>

            {isPlayingMusic ? (
              <div className="flex items-center gap-0.5 text-pink-500 flex-shrink-0 ml-1">
                <span className="w-0.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <Play className="w-3 h-3 text-slate-400 group-hover:text-pink-500 fill-slate-400 group-hover:fill-pink-500 transition-colors flex-shrink-0 ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Container de Mídia (Fotos e Vídeos) */}
      <div
        onDoubleClick={handleDoubleClickMedia}
        className="relative aspect-square sm:aspect-[4/3] w-full bg-black select-none overflow-hidden flex items-center justify-center cursor-pointer group"
      >
        {currentMedia ? (
          isCurrentVideo ? (
            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={togglePlayPause}
            >
              <video
                ref={videoRef}
                src={getMediaUrl(currentMedia.url)}
                className="w-full h-full object-contain"
                loop
                muted={isMuted}
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Badge de Vídeo no Topo */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                <Film className="w-3 h-3 text-pink-400" />
                <span>Vídeo</span>
              </div>

              {/* Botões de Controle de Som e Tela Cheia */}
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={handleToggleMute}
                  className="p-2.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all shadow-md backdrop-blur-sm"
                  title={isMuted ? 'Ativar som' : 'Mutar'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={handleFullscreen}
                  className="p-2.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all shadow-md backdrop-blur-sm"
                  title="Tela cheia"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Barra de Progresso do Vídeo */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all duration-100"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>

              {/* Overlay de Play / Pause ao clicar */}
              {showPlayOverlay && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-scale-fade">
                  <div className="p-4 rounded-full bg-black/60 backdrop-blur-md text-white shadow-2xl">
                    {isPlaying ? <Play className="w-10 h-10 fill-white" /> : <Pause className="w-10 h-10 fill-white" />}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <img
              src={getMediaUrl(currentMedia.url)}
              alt="Post media"
              className="w-full h-full object-contain transition-transform duration-200"
              loading="lazy"
              decoding="async"
            />
          )
        ) : (
          <div className="text-slate-500 text-xs">Mídia indisponível</div>
        )}

        {/* Double-Tap Heart Burst */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-heart-burst">
            <Heart className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Controles de navegação para carrossel */}
        {hasMultipleMedia && (
          <>
            {currentMediaIndex > 0 && (
              <button
                onClick={prevMedia}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full shadow-lg transition-transform hover:scale-105 opacity-80 group-hover:opacity-100 z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {currentMediaIndex < mediaList.length - 1 && (
              <button
                onClick={nextMedia}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full shadow-lg transition-transform hover:scale-105 opacity-80 group-hover:opacity-100 z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm z-10">
              {mediaList.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentMediaIndex ? 'bg-white w-3' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ações e Interações */}
      <div className="px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`transition-transform active:scale-125 ${
                isLiked ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300 hover:text-rose-500'
              }`}
              title={isLiked ? 'Descurtir' : 'Curtir'}
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked ? 'fill-rose-500 stroke-rose-500' : 'stroke-2'
                }`}
              />
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="text-slate-700 dark:text-slate-300 hover:text-brand-500 transition-colors"
              title="Comentários"
            >
              <MessageCircle className="w-6 h-6 stroke-2" />
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="text-slate-700 dark:text-slate-300 hover:text-brand-500 transition-colors"
              title="Compartilhar"
            >
              <Share2 className="w-6 h-6 stroke-2" />
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`transition-transform active:scale-110 ${
              isSaved ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300 hover:text-amber-500'
            }`}
            title={isSaved ? 'Remover dos Salvos' : 'Salvar Publicação'}
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                isSaved ? 'fill-amber-500 stroke-amber-500' : 'stroke-2'
              }`}
            />
          </button>
        </div>

        {/* Curtidas e Views */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => likesCount > 0 && setShowLikesModal(true)}
            className={`text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 ${
              likesCount > 0 ? 'hover:underline cursor-pointer' : 'cursor-default'
            }`}
          >
            {likesCount.toLocaleString()} {likesCount === 1 ? 'curtida' : 'curtidas'}
          </button>

          {post.viewsCount && post.viewsCount > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              <span>{post.viewsCount.toLocaleString()} views</span>
            </span>
          ) : null}
        </div>

        {/* Legenda */}
        {post.caption && (
          <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mb-2 leading-relaxed">
            <Link
              to={`/profile/${post.user.username}`}
              className="font-bold text-slate-900 dark:text-slate-100 mr-1.5 hover:underline inline-flex items-center gap-1"
            >
              <span>{post.user.displayName}</span>
              {post.user.isVerified && <VerifiedBadge size="xs" />}
            </Link>
            <span>{post.caption}</span>
          </div>
        )}

        {/* Ver todos os comentários */}
        {commentsCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium mb-1.5 transition-colors"
          >
            Ver todos os {commentsCount} comentários
          </button>
        )}

        {/* Data da Publicação */}
        <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wide">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
        </p>

        {showComments && (
          <CommentSection
            postId={post.id}
            onCommentCountChange={(count) => setCommentsCount(count)}
          />
        )}
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />

      <PostLikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={post.id}
      />
    </article>
  );
};
