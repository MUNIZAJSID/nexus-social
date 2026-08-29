import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Music, Play, Pause, Check, Volume2, Loader2, Disc } from 'lucide-react';
import { api } from '../../api/client';
import { MusicTrack } from '../../types';

interface MusicPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (track: MusicTrack) => void;
  selectedTrack?: MusicTrack | null;
}

export const MusicPickerModal: React.FC<MusicPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedTrack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Carrega catálogo padrão (Top hits) ou busca com debounce
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingTrackId(null);
      return;
    }

    const timer = setTimeout(() => {
      fetchMusic(searchTerm);
    }, searchTerm ? 350 : 0);

    return () => clearTimeout(timer);
  }, [isOpen, searchTerm]);

  const fetchMusic = async (query: string) => {
    setIsLoading(true);
    try {
      const res = await api.get('/music/search', {
        params: { q: query },
      });
      if (res.data.success) {
        setTracks(res.data.tracks || []);
      }
    } catch (err) {
      console.error('Erro ao buscar músicas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent, track: MusicTrack) => {
    e.stopPropagation();

    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(track.audioUrl);
      audio.volume = 0.85;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingTrackId(null);
      audioRef.current = audio;
      setPlayingTrackId(track.id);
    }
  };

  const handleSelectTrack = (track: MusicTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingTrackId(null);
    onSelect(track);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0e1424] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-pink-500 to-brand-500 text-white shadow-lg shadow-pink-500/20">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Adicionar Música</h3>
                <p className="text-[11px] text-slate-400">Catálogo com mais de 100 milhões de músicas</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                onClose();
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar música ou artista..."
              autoFocus
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Músicas */}
        <div className="p-3 sm:p-4 overflow-y-auto flex flex-col gap-2 max-h-96">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <span className="text-xs">Buscando faixas no catálogo...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-2 text-slate-400">
              <Disc className="w-8 h-8 text-slate-600 animate-spin-slow" />
              <p className="text-xs">Nenhuma música encontrada para "{searchTerm}".</p>
              <p className="text-[11px] text-slate-500">Tente buscar pelo nome do artista ou álbum.</p>
            </div>
          ) : (
            tracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              const isSelected = selectedTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500/40'
                      : 'bg-slate-900/40 hover:bg-slate-800/80 border-transparent hover:border-slate-700/60'
                  }`}
                >
                  {/* Capa e Botão de Play */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 group-hover:shadow-md transition-shadow">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                          <Music className="w-5 h-5" />
                        </div>
                      )}

                      {/* Botão de Preview Flutuante sobre a capa */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePlay(e, track)}
                        className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
                          isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title={isPlaying ? 'Pausar prévia' : 'Ouvir prévia'}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-pink-400 fill-pink-400" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Informações da Faixa */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${
                          isPlaying ? 'text-pink-400' : 'text-slate-100'
                        }`}>
                          {track.title}
                        </span>
                        {isPlaying && (
                          <span className="flex items-center gap-0.5 text-pink-400">
                            <span className="w-1 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">
                        {track.artist} {track.album ? `• ${track.album}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Ação de Selecionar */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTrack(track);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                          : 'bg-slate-800 hover:bg-brand-500 text-slate-200 hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Usando
                        </>
                      ) : (
                        'Usar'
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
