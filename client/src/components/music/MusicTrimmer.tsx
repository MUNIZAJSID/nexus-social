import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Disc, Music } from 'lucide-react';
import { MusicTrack } from '../../types';

interface MusicTrimmerProps {
  track: MusicTrack;
  startTime: number;
  duration: number;
  onTimeChange: (startTime: number, duration: number) => void;
  onClose?: () => void;
}

// Alturas estáticas para simular ondas sonoras com visual moderno
const WAVE_BARS = [
  35, 50, 75, 90, 65, 45, 100, 85, 95, 70,
  50, 90, 95, 80, 55, 70, 85, 100, 95, 75,
  60, 90, 100, 65, 45, 80, 95, 85, 65, 50,
];

// Pontos de atalho para corte rápido
const QUICK_PRESETS = [0, 5, 10, 15, 20, 25];

export const MusicTrimmer: React.FC<MusicTrimmerProps> = ({
  track,
  startTime,
  duration,
  onTimeChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [localStartTime, setLocalStartTime] = useState(startTime);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  // Refs para manter valores atualizados nos listeners
  const startTimeRef = useRef(startTime);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(false);

  const totalDuration = track.duration || 30;
  const maxStartTime = Math.max(0, totalDuration - 3);

  useEffect(() => {
    startTimeRef.current = startTime;
    setLocalStartTime(startTime);
  }, [startTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Função auxiliar para forçar o áudio para o segundo desejado
  const applySeek = (audio: HTMLAudioElement, sec: number) => {
    try {
      if (Math.abs(audio.currentTime - sec) > 0.3) {
        audio.currentTime = sec;
      }
    } catch (err) {
      console.warn('Seek pendente:', err);
    }
  };

  // Inicializa o elemento de áudio UMA ÚNICA VEZ para esta faixa
  useEffect(() => {
    const audio = new Audio(track.audioUrl);
    audio.volume = 0.85;
    audioRef.current = audio;

    const onReady = () => {
      applySeek(audio, startTimeRef.current);
    };

    audio.addEventListener('loadedmetadata', onReady);
    audio.addEventListener('canplay', onReady);

    const handleTimeUpdate = () => {
      if (!audioRef.current || isDraggingRef.current) return;
      const current = audioRef.current.currentTime;
      const start = startTimeRef.current;
      const dur = durationRef.current;

      // Se estiver fora da janela selecionada (antes do início ou após a duração), reinicia no início escolhido
      if (current < start - 0.4 || current >= start + dur || current >= totalDuration) {
        audioRef.current.currentTime = start;
        if (isPlayingRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    const handleEnded = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = startTimeRef.current;
        if (isPlayingRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onReady);
      audio.removeEventListener('canplay', onReady);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
      setIsPlaying(false);
      isPlayingRef.current = false;
    };
  }, [track.audioUrl, totalDuration]);

  const seekAndPlay = (newSec: number) => {
    const clamped = Math.min(maxStartTime, Math.max(0, newSec));
    setLocalStartTime(clamped);
    startTimeRef.current = clamped;
    onTimeChange(clamped, durationRef.current);

    if (audioRef.current) {
      try {
        audioRef.current.currentTime = clamped;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
        isPlayingRef.current = true;
      } catch (e) {
        console.warn('Erro ao pular:', e);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      audioRef.current.currentTime = localStartTime;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      isPlayingRef.current = true;
    }
  };

  // ARRSTO POR TOQUE / POINTER DIRETO NO CONTAINER (100% confiável no celular e PC)
  const calculateSecFromPointer = (clientX: number) => {
    if (!waveformRef.current) return localStartTime;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const calculatedSec = Math.min(maxStartTime, Math.max(0, Math.round(ratio * totalDuration * 2) / 2));
    return calculatedSec;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = true;
    const newSec = calculateSecFromPointer(e.clientX);
    seekAndPlay(newSec);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const newSec = calculateSecFromPointer(e.clientX);
    setLocalStartTime(newSec);
    startTimeRef.current = newSec;
    onTimeChange(newSec, durationRef.current);

    if (audioRef.current) {
      try {
        audioRef.current.currentTime = newSec;
      } catch {}
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      const finalSec = calculateSecFromPointer(e.clientX);
      seekAndPlay(finalSec);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startPercent = Math.min(100, (localStartTime / totalDuration) * 100);
  const clipWidthPercent = Math.min(100 - startPercent, (Math.min(duration, totalDuration) / totalDuration) * 100);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-pink-500/30 text-white shadow-2xl animate-in slide-in-from-bottom-2 duration-200 select-none">
      {/* Header com Faixa e Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 shadow-md">
            {track.coverUrl ? (
              <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-pink-400">
                <Disc className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-100 truncate flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <span className="truncate">{track.title}</span>
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {track.artist}
            </span>
          </div>
        </div>

        {/* Botão Play/Pause do Trecho */}
        <button
          type="button"
          onClick={togglePlay}
          className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-brand-500 hover:opacity-90 text-white transition-all shadow-md shadow-pink-500/25 active:scale-95 cursor-pointer flex-shrink-0"
          title={isPlaying ? 'Pausar trecho' : 'Ouvir trecho'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>
      </div>

      {/* Onda Sonora com Arrastador Táctil (Pointer/Touch Draggable) */}
      <div className="flex flex-col gap-2 pt-1">
        <div
          ref={waveformRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full h-16 rounded-2xl bg-black/75 overflow-hidden flex items-center px-3 border-2 border-slate-700/80 cursor-ew-resize touch-none shadow-inner"
        >
          {/* Ondas Sonoras de Fundo */}
          <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none opacity-50">
            {WAVE_BARS.map((height, idx) => (
              <div
                key={idx}
                className="w-1 rounded-full bg-gradient-to-t from-slate-600 via-pink-400 to-brand-400 transition-all"
                style={{ height: `${height * 0.5}px` }}
              />
            ))}
          </div>

          {/* Janela de Seleção do Trecho Visual e Arrastável (Instagram Style) */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-pink-500/35 border-2 border-pink-400 pointer-events-none shadow-xl shadow-pink-500/30 flex items-center justify-between px-2 transition-all duration-75"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(20, clipWidthPercent)}%`,
            }}
          >
            <div className="w-1.5 h-6 bg-pink-200 rounded-full shadow-sm" />
            <span className="text-[10px] font-black text-white drop-shadow">
              {formatSeconds(localStartTime)}
            </span>
            <div className="w-1.5 h-6 bg-pink-200 rounded-full shadow-sm" />
          </div>
        </div>

        {/* Atalhos Rápidos de Início (0s, 5s, 10s, 15s, 20s, 25s) */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          {QUICK_PRESETS.filter((p) => p <= maxStartTime).map((presetSec) => {
            const isSelected = Math.abs(localStartTime - presetSec) < 1;
            return (
              <button
                key={presetSec}
                type="button"
                onClick={() => seekAndPlay(presetSec)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30 scale-105'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {presetSec === 0 ? '0s' : `${presetSec}s`}
              </button>
            );
          })}
        </div>

        {/* Indicadores de Tempo */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 pt-1">
          <span className="text-pink-400 font-bold flex items-center gap-1">
            <span>Início:</span>
            <span className="bg-pink-500/20 px-2 py-0.5 rounded-lg text-pink-300">{formatSeconds(localStartTime)}</span>
          </span>
          <span className="text-slate-300">
            Duração: {duration}s
          </span>
          <span>
            Total: {formatSeconds(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  );
};
