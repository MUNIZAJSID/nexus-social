import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { getMediaUrl } from '../../api/client';

interface AudioMessagePlayerProps {
  audioUrl: string;
  isSelf: boolean;
}

export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  audioUrl,
  isSelf,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(getMediaUrl(audioUrl));
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 p-1 min-w-[200px] max-w-[260px] select-none"
    >
      {/* Botão Play/Pause */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md ${
          isSelf
            ? 'bg-white text-brand-600 hover:bg-slate-100'
            : 'bg-gradient-to-tr from-brand-600 to-pink-600 text-white hover:opacity-95'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Barra de Progresso e Ondas Sonoras */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 h-6">
          {[40, 70, 90, 60, 45, 80, 100, 85, 60, 75, 90, 50, 65, 80, 55].map(
            (barHeight, idx) => {
              const barPercent = (idx / 15) * 100;
              const isPast = progressPercent >= barPercent;

              return (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all ${
                    isPast
                      ? isSelf
                        ? 'bg-white'
                        : 'bg-brand-500'
                      : isSelf
                      ? 'bg-white/40'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  style={{
                    height: `${isPlaying && isPast ? barHeight * 0.22 : barHeight * 0.18}px`,
                  }}
                />
              );
            }
          )}
        </div>

        <div
          className={`flex items-center justify-between text-[10px] font-bold ${
            isSelf ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span>{formatSeconds(currentTime)}</span>
          <span>{duration > 0 ? formatSeconds(duration) : 'Áudio'}</span>
        </div>
      </div>
    </div>
  );
};
