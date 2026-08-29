import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Heart,
  Eye,
  Trash2,
  Users,
  Sparkles,
  Music,
  Disc,
  Send,
  Smile,
  Check,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { getMediaUrl, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StoryGroup, StoryViewer } from '../../types';
import { PollSticker, QuestionSticker } from '../story/StoryStickers';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyGroups: StoryGroup[];
  initialGroupIndex?: number;
}

const QUICK_REACTIONS = ['🔥', '❤️', '😂', '😮', '😢', '👏', '🎉', '💯'];

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  storyGroups,
  initialGroupIndex = 0,
}) => {
  const { user } = useAuth();
  const [currentGroupIdx, setCurrentGroupIdx] = useState(initialGroupIndex);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Story Reply State
  const [replyText, setReplyText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<string | null>(null);
  const [showQuickReactions, setShowQuickReactions] = useState(false);

  // Likes & Views states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  const currentGroup = storyGroups[currentGroupIdx];
  const currentStory = currentGroup?.stories[currentStoryIdx];

  const isOwner = user && currentGroup && (currentGroup.user.id === user.id || currentStory?.isOwner);

  // Pausar imediatamente qualquer som/vídeo do feed ao abrir os Stories
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('nexus:pause_all_media'));
      setCurrentGroupIdx(initialGroupIndex);
      setCurrentStoryIdx(0);
      setProgress(0);
      setShowViewersSheet(false);
      setReplyText('');
      setIsInputFocused(false);
      setShowQuickReactions(false);
    }
  }, [initialGroupIndex, isOpen]);

  // Se o usuário estiver digitando resposta ou interagindo, o story pausa completamente (foto, vídeo e timer)
  const isReplying = Boolean(replyText.trim().length > 0 || isInputFocused || showQuickReactions);
  const isMediaPaused = Boolean(isPaused || isReplying || showViewersSheet || !isOpen);

  // Gerenciamento de Trilha Sonora / Música do Story
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }

    if (!isOpen || !currentStory || !currentStory.musicAudioUrl) return;

    const audio = new Audio(currentStory.musicAudioUrl);
    audio.loop = true;
    audio.muted = isMuted;
    audio.volume = 0.85;
    const targetStart = currentStory.musicStartTime || 0;

    const applyStartTime = () => {
      if (targetStart > 0 && Math.abs(audio.currentTime - targetStart) > 0.4) {
        try {
          audio.currentTime = targetStart;
        } catch {}
      }
    };

    audio.addEventListener('loadedmetadata', applyStartTime);
    audio.addEventListener('canplay', applyStartTime);

    musicAudioRef.current = audio;

    if (!isMediaPaused) {
      audio.play().then(applyStartTime).catch(() => {});
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', applyStartTime);
      audio.removeEventListener('canplay', applyStartTime);
    };
  }, [currentStory?.id, isOpen]);

  // Sincroniza Play / Pause e Mute da Música do Story
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.muted = isMuted;
      if (isMediaPaused) {
        musicAudioRef.current.pause();
      } else {
        musicAudioRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, isMediaPaused]);

  // Sincroniza Play / Pause do Vídeo do Story (pausa ao responder)
  useEffect(() => {
    if (videoRef.current) {
      if (isMediaPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isMediaPaused, currentStory?.id]);

  // Sync like/views state when story changes & record view
  useEffect(() => {
    if (!currentStory) return;
    setIsLiked(Boolean(currentStory.isLiked));
    setLikesCount(currentStory.likesCount || 0);
    setViewsCount(currentStory.viewsCount || 0);
    setShowViewersSheet(false);

    // Record view if not owner
    if (user && currentGroup && currentGroup.user.id !== user.id) {
      api.post(`/stories/${currentStory.id}/view`)
        .then((res) => {
          if (res.data.success && res.data.viewsCount !== undefined) {
            setViewsCount(res.data.viewsCount);
          }
        })
        .catch(() => {});
    }
  }, [currentStory?.id, user?.id]);

  // Story Progress Timer (pausado automaticamente durante digitação de resposta)
  useEffect(() => {
    if (!isOpen || !currentStory || isMediaPaused) return;

    const interval = 50; // ms
    const duration = (currentStory.duration || (currentStory.mediaType === 'VIDEO' ? 15 : 10)) * 1000;
    const step = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [isOpen, currentStory, currentGroupIdx, currentStoryIdx, isMediaPaused]);

  const handleNextStory = () => {
    setProgress(0);
    setShowViewersSheet(false);
    if (!currentGroup) return;

    if (currentStoryIdx < currentGroup.stories.length - 1) {
      setCurrentStoryIdx((prev) => prev + 1);
    } else if (currentGroupIdx < storyGroups.length - 1) {
      setCurrentGroupIdx((prev) => prev + 1);
      setCurrentStoryIdx(0);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    setProgress(0);
    setShowViewersSheet(false);
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx((prev) => prev - 1);
    } else if (currentGroupIdx > 0) {
      setCurrentGroupIdx((prev) => prev - 1);
      setCurrentStoryIdx(storyGroups[currentGroupIdx - 1].stories.length - 1);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory || !user || isLiking) return;

    setIsLiking(true);
    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.post(`/stories/${currentStory.id}/like`);
      if (res.data.success) {
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.likesCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleOpenViewers = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory || !isOwner) return;

    setShowViewersSheet(true);
    setIsLoadingViewers(true);

    try {
      const res = await api.get(`/stories/${currentStory.id}/viewers`);
      if (res.data.success) {
        setViewers(res.data.viewers);
        setViewsCount(res.data.viewersCount);
        setLikesCount(res.data.likesCount);
      }
    } catch (err) {
      console.error('Erro ao carregar visualizadores:', err);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  const handleDeleteStory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory || isDeleting) return;
    if (!window.confirm('Tem certeza de que deseja excluir este Story?')) return;

    setIsDeleting(true);
    try {
      const res = await api.delete(`/stories/${currentStory.id}`);
      if (res.data.success) {
        handleNextStory();
      }
    } catch (err) {
      console.error('Erro ao deletar story:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendReply = async (textToSend?: string) => {
    const content = textToSend || replyText;
    if (!content.trim() || isSendingReply || !currentStory) return;

    setIsSendingReply(true);
    try {
      const res = await api.post(`/stories/${currentStory.id}/reply`, {
        message: content.trim(),
      });
      if (res.data.success) {
        setReplyText('');
        setIsInputFocused(false);
        setShowQuickReactions(false);
        setReplyFeedback('Mensagem enviada no direct!');
        setTimeout(() => setReplyFeedback(null), 2500);
      }
    } catch (err) {
      console.error('Erro ao responder story:', err);
    } finally {
      setIsSendingReply(false);
      setIsPaused(false);
    }
  };

  if (!isOpen || !currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none">
      {/* Navegação entre grupos de stories (Desktop) */}
      {currentGroupIdx > 0 && (
        <button
          onClick={handlePrevStory}
          className="hidden sm:flex absolute left-8 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-transform hover:scale-110 z-20 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {currentGroupIdx < storyGroups.length - 1 && (
        <button
          onClick={handleNextStory}
          className="hidden sm:flex absolute right-8 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-transform hover:scale-110 z-20 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Card Central do Story */}
      <div
        className="relative w-full max-w-sm sm:max-w-md h-full sm:h-[85vh] bg-slate-950 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
        onMouseDown={() => !showViewersSheet && !replyText && setIsPaused(true)}
        onMouseUp={() => !showViewersSheet && !replyText && setIsPaused(false)}
        onTouchStart={() => !showViewersSheet && !replyText && setIsPaused(true)}
        onTouchEnd={() => !showViewersSheet && !replyText && setIsPaused(false)}
      >
        {/* Barras de Progresso no Topo */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-3 pt-3 bg-gradient-to-b from-black/80 to-transparent">
          {currentGroup.stories.map((story, idx) => (
            <div
              key={story.id}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx < currentStoryIdx
                      ? '100%'
                      : idx === currentStoryIdx
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Cabeçalho do Story (Avatar, Nome, Tempo e Botões de Controle) */}
        <div className="absolute top-6 left-0 right-0 z-30 px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={currentGroup.user.avatarUrl}
              name={currentGroup.user.displayName}
              size="sm"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-white text-xs font-bold truncate">
                  {currentGroup.user.displayName}
                </span>
                {currentGroup.user.isVerified && <VerifiedBadge size="xs" />}
              </div>
              <span className="text-[10px] text-white/70">
                {formatDistanceToNow(new Date(currentStory.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(currentStory.mediaType === 'VIDEO' || currentStory.musicAudioUrl) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer backdrop-blur-sm"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={handleDeleteStory}
                disabled={isDeleting}
                title="Excluir Story"
                className="p-2 bg-black/50 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer backdrop-blur-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selo de Música Animado (Instagram Style) */}
        {currentStory.musicTitle && (
          <div className="absolute top-16 left-3.5 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
            <div className={`relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0 ${
              !isMuted ? 'animate-spin-slow' : ''
            }`}>
              {currentStory.musicCoverUrl ? (
                <img src={currentStory.musicCoverUrl} alt={currentStory.musicTitle} className="w-full h-full object-cover" />
              ) : (
                <Disc className="w-4 h-4 text-pink-400" />
              )}
            </div>
            <span className="truncate max-w-[170px]">
              {currentStory.musicTitle} • {currentStory.musicArtist}
            </span>
            {!isMuted && (
              <span className="flex items-center gap-0.5 text-pink-400">
                <span className="w-0.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
        )}

        {/* Mídia do Story */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {currentStory.mediaType === 'VIDEO' ? (
            <video
              ref={videoRef}
              src={getMediaUrl(currentStory.mediaUrl)}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
          ) : (
            <img
              src={getMediaUrl(currentStory.mediaUrl)}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}

          {/* Áreas clicáveis para Avançar / Voltar no celular */}
          {!showViewersSheet && (
            <>
              <div
                onClick={handlePrevStory}
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
              />
              <div
                onClick={handleNextStory}
                className="absolute right-0 top-0 bottom-0 w-2/3 z-10 cursor-pointer"
              />
            </>
          )}
        </div>

        {/* Figurinhas Interativas sobre a Mídia (Enquetes e Perguntas) */}
        {currentStory.stickers && currentStory.stickers.length > 0 && !showViewersSheet && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 gap-3 pointer-events-none">
            {currentStory.stickers.map((stk) => (
              <div key={stk.id} className="pointer-events-auto">
                {stk.type === 'POLL' ? (
                  <PollSticker sticker={stk} isOwner={isOwner} />
                ) : (
                  <QuestionSticker sticker={stk} isOwner={isOwner} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legenda do Story */}
        {currentStory.caption && !showViewersSheet && (
          <div className="absolute bottom-20 left-4 right-4 z-20 p-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs leading-relaxed text-center">
            {currentStory.caption}
          </div>
        )}

        {/* Barra Inferior (Responder Story ou Ver Visualizações) */}
        <div className="absolute bottom-4 left-3 right-3 z-30 flex flex-col gap-2">
          {/* Feedback Toast */}
          {replyFeedback && (
            <div className="self-center px-4 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{replyFeedback}</span>
            </div>
          )}

          {/* Quick Reaction Emojis Popover / Row */}
          {!isOwner && user && showQuickReactions && (
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl animate-in zoom-in-95 duration-150">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendReply(emoji)}
                  className="text-xl hover:scale-125 transition-transform active:scale-95 cursor-pointer"
                  title={`Reagir com ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Se for o dono: Mostra pílula de quem viu e quem curtiu */}
            {isOwner ? (
              <button
                onClick={handleOpenViewers}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center gap-1 text-emerald-400">
                  <Eye className="w-4 h-4" />
                  <span>{viewsCount}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <div className="flex items-center gap-1 text-pink-400">
                  <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                  <span>{likesCount}</span>
                </div>
                <span className="text-[10px] text-white/70 ml-0.5">Ver quem viu</span>
              </button>
            ) : (
              /* Se for espectador: Barra de Resposta Direta */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                className="flex-1 flex items-center gap-1.5 bg-black/50 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1.5 shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickReactions(!showQuickReactions);
                    setIsPaused(true);
                  }}
                  className="p-1 text-white/70 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Reações rápidas"
                >
                  <Smile className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => {
                    setIsInputFocused(false);
                  }}
                  placeholder={`Enviar mensagem para @${currentGroup.user.username}...`}
                  className="flex-1 bg-transparent text-xs text-white placeholder-white/50 focus:outline-none font-medium"
                />

                {replyText.trim() ? (
                  <button
                    type="submit"
                    disabled={isSendingReply}
                    className="p-1 text-brand-400 hover:text-brand-300 transition-colors cursor-pointer active:scale-95"
                    title="Enviar resposta"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                ) : null}
              </form>
            )}

            {/* Botão de Curtir para quem assiste */}
            {!isOwner && user && (
              <button
                onClick={handleToggleLike}
                className={`p-2.5 rounded-full backdrop-blur-md border transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-lg flex-shrink-0 ${
                  isLiked
                    ? 'bg-pink-500/20 border-pink-500/40 text-pink-400 scale-110'
                    : 'bg-black/50 border-white/20 text-white hover:scale-105'
                }`}
              >
                <Heart
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isLiked ? 'fill-pink-500 text-pink-500 scale-110' : 'text-white'
                  }`}
                />
                {likesCount > 0 && (
                  <span className="text-xs font-bold mr-1">{likesCount}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* GAVETA / MODAL DE VISUALIZADORES (Para o Dono do Story) */}
        {showViewersSheet && (
          <div className="absolute inset-x-0 bottom-0 max-h-[75%] z-30 bg-[#0e1424]/95 backdrop-blur-2xl border-t border-slate-800 rounded-t-3xl p-5 flex flex-col gap-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header da Gaveta */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Visualizações ({viewsCount})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {likesCount} {likesCount === 1 ? 'curtida' : 'curtidas'} neste Story
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowViewersSheet(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Usuários */}
            <div className="overflow-y-auto max-h-60 flex flex-col gap-2.5 pr-1">
              {isLoadingViewers ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Carregando visualizadores...
                </div>
              ) : viewers.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center gap-2 text-slate-400">
                  <Eye className="w-8 h-8 text-slate-600" />
                  <p className="text-xs">Ninguém visualizou este Story ainda.</p>
                </div>
              ) : (
                viewers.map((viewer) => (
                  <div
                    key={viewer.id}
                    className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={viewer.avatarUrl} name={viewer.displayName} size="sm" />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-100">
                            {viewer.displayName}
                          </span>
                          {viewer.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          @{viewer.username} • {formatDistanceToNow(new Date(viewer.viewedAt), { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {viewer.hasLiked && (
                      <div
                        title="Curtiu este story"
                        className="p-1.5 rounded-full bg-pink-500/10 text-pink-500 flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Heart className="w-3.5 h-3.5 fill-pink-500" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Ação de Excluir dentro da Gaveta */}
            {isOwner && (
              <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                <button
                  type="button"
                  onClick={handleDeleteStory}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir este Story</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
