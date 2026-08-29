import React, { useState, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  Upload,
  Sparkles,
  AlertCircle,
  Music,
  Disc,
  Clock,
  Type,
  Trash2,
  Check,
  Volume2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { MusicPickerModal } from '../music/MusicPickerModal';
import { MusicTrimmer } from '../music/MusicTrimmer';
import { StickerPickerModal, DraftSticker } from '../story/StickerPickerModal';
import { PollSticker, QuestionSticker } from '../story/StoryStickers';
import { api } from '../../api/client';
import { MusicTrack } from '../../types';
import { Smile } from 'lucide-react';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

const DURATION_OPTIONS = [5, 10, 15, 30];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);

  // Duration: 5s, 10s, 15s, 30s (default 10s)
  const [storyDuration, setStoryDuration] = useState<number>(10);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Stickers state
  const [draftStickers, setDraftStickers] = useState<DraftSticker[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Music state & offset
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [musicStartTime, setMusicStartTime] = useState<number>(0);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showMusicTrimmer, setShowMusicTrimmer] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video/');
    setIsVideo(isVid);
    setSelectedFile(file);
    setError('');

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedMusic(null);
    setMusicStartTime(0);
    setCaption('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setError('Por favor, selecione uma foto ou vídeo para o seu Story.');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('media', selectedFile);
    formData.append('duration', String(storyDuration));

    if (caption.trim()) {
      formData.append('caption', caption.trim());
    }

    if (selectedMusic) {
      formData.append('musicTitle', selectedMusic.title);
      formData.append('musicArtist', selectedMusic.artist);
      if (selectedMusic.coverUrl) formData.append('musicCoverUrl', selectedMusic.coverUrl);
      formData.append('musicAudioUrl', selectedMusic.audioUrl);
      formData.append('musicStartTime', String(musicStartTime));
      formData.append('musicDuration', String(storyDuration));
    }

    if (draftStickers.length > 0) {
      formData.append('stickers', JSON.stringify(draftStickers));
    }

    try {
      const res = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        handleClearFile();
        setDraftStickers([]);
        onStoryCreated();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao publicar o Story. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md h-[92vh] sm:h-[88vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* CASO NÃO TENHA MÍDIA SELECIONADA: TELA DE UPLOAD INICIAL */}
        {!previewUrl ? (
          <div className="flex-1 flex flex-col">
            {/* Header Simples */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-pink-500 text-white shadow-md shadow-brand-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Criar Story</h2>
                  <p className="text-[10px] text-slate-400">Fotos ou vídeos em tela cheia</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center">
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[9/14] max-h-[500px] border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-3xl flex flex-col items-center justify-center gap-4 p-6 cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-brand-500/10 group-hover:bg-brand-500/20 text-brand-400 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-brand-500/10">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-200">Escolha uma foto ou vídeo</p>
                  <p className="text-xs text-slate-400 mt-1">Toque para selecionar da galeria</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                    <ImageIcon className="w-3.5 h-3.5 text-brand-400" /> Foto
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                    <Video className="w-3.5 h-3.5 text-pink-400" /> Vídeo
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CANVAS DE PRÉ-VISUALIZAÇÃO COMPLETO ESTILO INSTAGRAM */
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-black">
            {/* Mídia em tela cheia de fundo */}
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
              {isVideo ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview Story"
                  className="w-full h-full object-cover"
                />
              )}
              {/* Gradientes sutis para legibilidade dos controles */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            </div>

            {/* BARRA SUPERIOR DE FERRAMENTAS DO INSTAGRAM */}
            <div className="relative z-30 p-3 sm:p-4 flex items-center justify-between">
              {/* Botão Fechar / Descartar */}
              <button
                type="button"
                onClick={handleClearFile}
                className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="Descartar e escolher outra foto/vídeo"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Ferramentas do Story à Direita */}
              <div className="flex items-center gap-2">
                {/* Seletor de Duração (5s, 10s, 15s, 30s, 40s) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDurationPicker(!showDurationPicker)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md transition-colors border border-white/15 cursor-pointer shadow-lg"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{storyDuration}s</span>
                  </button>

                  {/* Popover de Duração */}
                  {showDurationPicker && (
                    <div className="absolute top-full right-0 mt-2 p-1.5 bg-[#0e1424]/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-1 z-40 backdrop-blur-xl animate-in fade-in duration-100">
                      <span className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                        Tempo do Story
                      </span>
                      {DURATION_OPTIONS.map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setStoryDuration(sec);
                            setShowDurationPicker(false);
                          }}
                          className={`flex items-center justify-between gap-4 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            storyDuration === sec
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <span>{sec} segundos</span>
                          {storyDuration === sec && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão de Figurinhas Interativas */}
                <button
                  type="button"
                  onClick={() => setShowStickerPicker(true)}
                  className={`p-2.5 rounded-full text-xs font-bold backdrop-blur-md transition-colors border cursor-pointer shadow-lg ${
                    draftStickers.length > 0
                      ? 'bg-amber-500 text-white border-amber-400'
                      : 'bg-black/50 hover:bg-black/80 text-white border-white/15'
                  }`}
                  title="Adicionar figurinhas (enquete, perguntas)"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {/* Botão de Música */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMusic) {
                      setShowMusicTrimmer(!showMusicTrimmer);
                    } else {
                      setShowMusicPicker(true);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all border cursor-pointer shadow-lg ${
                    selectedMusic
                      ? 'bg-pink-500 text-white border-pink-400 shadow-pink-500/30'
                      : 'bg-black/50 hover:bg-black/80 text-white border-white/15'
                  }`}
                  title="Adicionar música"
                >
                  <Music className={`w-3.5 h-3.5 ${selectedMusic ? 'animate-bounce' : 'text-pink-400'}`} />
                  <span>{selectedMusic ? 'Música' : 'Música'}</span>
                </button>

                {/* Botão de Legenda */}
                <button
                  type="button"
                  onClick={() => setShowCaptionInput(!showCaptionInput)}
                  className={`p-2.5 rounded-full text-xs font-bold backdrop-blur-md transition-colors border cursor-pointer shadow-lg ${
                    caption
                      ? 'bg-brand-500 text-white border-brand-400'
                      : 'bg-black/50 hover:bg-black/80 text-white border-white/15'
                  }`}
                  title="Adicionar legenda"
                >
                  <Type className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ADESIVOS VISUAIS SOBRE A MÍDIA */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 gap-3">
              {/* Figurinhas Interativas no Canvas (Enquetes e Perguntas) */}
              {draftStickers.map((stk, idx) => (
                <div key={idx} className="relative group/stk">
                  {stk.type === 'POLL' ? (
                    <PollSticker
                      sticker={{
                        id: `draft-${idx}`,
                        type: 'POLL',
                        question: stk.question,
                        options: stk.options || ['Sim', 'Não'],
                        voteCounts: [0, 0],
                      }}
                      isOwner={true}
                    />
                  ) : (
                    <QuestionSticker
                      sticker={{
                        id: `draft-${idx}`,
                        type: 'QUESTION',
                        question: stk.question,
                        options: [],
                      }}
                      isOwner={true}
                    />
                  )}
                  {/* Botão para Remover Figurinha */}
                  <button
                    type="button"
                    onClick={() => setDraftStickers((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-transform active:scale-90"
                    title="Remover figurinha"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Adesivo de Música Animado (Estilo Instagram) */}
              {selectedMusic && (
                <div
                  onClick={() => setShowMusicTrimmer(true)}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-xl text-white border border-pink-500/30 shadow-2xl transition-transform hover:scale-105 cursor-pointer animate-in zoom-in-95 duration-200"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 animate-spin-slow shadow-md border border-white/20">
                    {selectedMusic.coverUrl ? (
                      <img src={selectedMusic.coverUrl} alt={selectedMusic.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-pink-400">
                        <Disc className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-xs font-bold truncate max-w-[180px]">
                      {selectedMusic.title}
                    </span>
                    <span className="text-[10px] text-slate-300 truncate max-w-[180px]">
                      {selectedMusic.artist}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMusic(null);
                      setShowMusicTrimmer(false);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-rose-400 transition-colors ml-1"
                    title="Remover música"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Adesivo de Legenda no Canvas */}
              {caption && !showCaptionInput && (
                <div
                  onClick={() => setShowCaptionInput(true)}
                  className="px-4 py-2 rounded-2xl bg-black/65 backdrop-blur-md text-white text-xs font-medium text-center max-w-[85%] border border-white/10 shadow-xl cursor-pointer hover:scale-105 transition-transform"
                >
                  {caption}
                </div>
              )}

              {/* Campo Flutuante de Edição de Legenda */}
              {showCaptionInput && (
                <div className="w-full max-w-[90%] flex items-center gap-2 p-2 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/20 shadow-2xl animate-in zoom-in-95 duration-150">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escreva algo sobre esse momento..."
                    autoFocus
                    maxLength={150}
                    className="flex-1 bg-transparent px-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCaptionInput(false)}
                    className="p-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* SEÇÃO INFERIOR: CORTADOR DE MÚSICA & BOTÃO DE PUBLICAR */}
            <div className="relative z-30 p-4 flex flex-col gap-3">
              {/* Cortador de Música (Wave Trimmer) */}
              {selectedMusic && showMusicTrimmer && (
                <MusicTrimmer
                  track={selectedMusic}
                  startTime={musicStartTime}
                  duration={storyDuration}
                  onTimeChange={(start) => setMusicStartTime(start)}
                  onClose={() => setShowMusicTrimmer(false)}
                />
              )}

              {error && (
                <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botão de Publicar Estilo Instagram */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  isLoading={isLoading}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-pink-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Seu Story ({storyDuration}s)</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Modal de Figurinhas Interativas */}
        <StickerPickerModal
          isOpen={showStickerPicker}
          onClose={() => setShowStickerPicker(false)}
          onAddSticker={(stk) => setDraftStickers((prev) => [...prev, stk])}
        />

        {/* Modal Buscador de Músicas */}
        <MusicPickerModal
          isOpen={showMusicPicker}
          onClose={() => setShowMusicPicker(false)}
          onSelect={(track) => {
            setSelectedMusic(track);
            setMusicStartTime(0);
            setShowMusicTrimmer(true);
          }}
          selectedTrack={selectedMusic}
        />
      </div>
    </div>
  );
};
