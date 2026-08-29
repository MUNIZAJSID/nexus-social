import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Trash2,
  Disc,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { api, getMediaUrl } from '../../api/client';
import { Highlight, HighlightItem } from '../../types';

interface HighlightViewerModalProps {
  isOpen: boolean;
  highlight: Highlight | null;
  isOwner: boolean;
  onClose: () => void;
  onHighlightDeleted?: (id: string) => void;
}

export const HighlightViewerModal: React.FC<HighlightViewerModalProps> = ({
  isOpen,
  highlight,
  isOwner,
  onClose,
  onHighlightDeleted,
}) => {
  const [currentItemIdx, setCurrentItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  const items: HighlightItem[] = highlight?.items || [];
  const currentItem: HighlightItem | undefined = items[currentItemIdx];

  useEffect(() => {
    if (isOpen) {
      setCurrentItemIdx(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, highlight?.id]);

  // Gerenciamento de Áudio de Música
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }

    if (!isOpen || !currentItem || !currentItem.musicAudioUrl) return;

    const audio = new Audio(currentItem.musicAudioUrl);
    audio.loop = true;
    audio.muted = isMuted;
    audio.volume = 0.85;
    const targetStart = currentItem.musicStartTime || 0;

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

    if (!isPaused) {
      audio.play().then(applyStartTime).catch(() => {});
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', applyStartTime);
      audio.removeEventListener('canplay', applyStartTime);
    };
  }, [currentItem?.id, isOpen]);

  // Sync áudio com pause/mute
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.muted = isMuted;
      if (isPaused || !isOpen) {
        musicAudioRef.current.pause();
      } else {
        musicAudioRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, isPaused, isOpen]);

  // Timer de Progresso
  useEffect(() => {
    if (!isOpen || !currentItem || isPaused) return;

    const interval = 50; // ms
    const duration = (currentItem.duration || (currentItem.mediaType === 'VIDEO' ? 15 : 10)) * 1000;
    const step = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentItemIdx, isPaused, items.length]);

  if (!isOpen || !highlight || items.length === 0) return null;

  const handleNext = () => {
    if (currentItemIdx < items.length - 1) {
      setCurrentItemIdx((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentItemIdx > 0) {
      setCurrentItemIdx((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleDeleteHighlight = async () => {
    if (!window.confirm('Tem certeza de que deseja excluir este destaque?')) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/highlights/${highlight.id}`);
      if (res.data.success) {
        onHighlightDeleted?.(highlight.id);
        onClose();
      }
    } catch (err) {
      console.error('Erro ao excluir destaque:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full max-w-sm sm:max-w-md h-full sm:h-[92vh] bg-black flex flex-col justify-between overflow-hidden sm:rounded-3xl shadow-2xl">
        
        {/* BARRAS DE PROGRESSO NO TOPO */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 pt-3 flex gap-1 bg-gradient-to-b from-black/80 to-transparent">
          {items.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx < currentItemIdx
                      ? '100%'
                      : idx === currentItemIdx
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* CABEÇALHO DO DESTAQUE */}
        <div className="absolute top-6 inset-x-0 z-30 px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {highlight.user && (
              <Avatar
                src={highlight.user.avatarUrl}
                name={highlight.user.displayName}
                size="sm"
                className="ring-2 ring-amber-400"
              />
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 truncate text-white text-xs font-bold">
                <span>{highlight.title}</span>
                {highlight.user?.isVerified && <VerifiedBadge size="xs" />}
              </div>
              <span className="text-[10px] text-white/70">
                {currentItemIdx + 1} de {items.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(currentItem.mediaType === 'VIDEO' || currentItem.musicAudioUrl) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer backdrop-blur-sm"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteHighlight();
                }}
                disabled={isDeleting}
                title="Excluir Destaque"
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

        {/* SELO DE MÚSICA ANIMADO */}
        {currentItem.musicTitle && (
          <div className="absolute top-16 left-3.5 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
            <div className={`relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0 ${
              !isMuted ? 'animate-spin-slow' : ''
            }`}>
              {currentItem.musicCoverUrl ? (
                <img src={currentItem.musicCoverUrl} alt={currentItem.musicTitle} className="w-full h-full object-cover" />
              ) : (
                <Disc className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <span className="truncate max-w-[170px]">
              {currentItem.musicTitle} • {currentItem.musicArtist}
            </span>
          </div>
        )}

        {/* MÍDIA EM TELA CHEIA */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {currentItem.mediaType === 'VIDEO' ? (
            <video
              ref={videoRef}
              src={getMediaUrl(currentItem.mediaUrl)}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
          ) : (
            <img
              src={getMediaUrl(currentItem.mediaUrl)}
              alt="Highlight"
              className="w-full h-full object-cover"
            />
          )}

          {/* Áreas de Toque para Voltar / Avançar */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-2/3 z-10 cursor-pointer"
          />
        </div>

        {/* LEGENDA NO RODAPÉ */}
        {currentItem.caption && (
          <div className="absolute bottom-6 inset-x-0 z-30 px-4 text-center pointer-events-none">
            <span className="inline-block px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10 max-w-[90%] shadow-lg">
              {currentItem.caption}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
