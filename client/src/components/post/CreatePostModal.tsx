import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea, Input } from '../ui/Input';
import { ImagePlus, MapPin, X, Film, Music, Disc } from 'lucide-react';
import { MusicPickerModal } from '../music/MusicPickerModal';
import { api } from '../../api/client';
import { Post, MusicTrack } from '../../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
}

interface PreviewItem {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [mediaList, setMediaList] = useState<PreviewItem[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (mediaList.length + files.length > 10) {
      setError('Você pode enviar no máximo 10 mídias por publicação.');
      return;
    }

    const newPreviews: PreviewItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
    }));

    setMediaList((prev) => [...prev, ...newPreviews]);
    setError('');
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => {
      const itemToRemove = prev[index];
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaList.length === 0) {
      setError('Adicione pelo menos uma foto ou vídeo para publicar.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('location', location);

      if (selectedMusic) {
        formData.append('musicTitle', selectedMusic.title);
        formData.append('musicArtist', selectedMusic.artist);
        if (selectedMusic.coverUrl) formData.append('musicCoverUrl', selectedMusic.coverUrl);
        formData.append('musicAudioUrl', selectedMusic.audioUrl);
      }

      mediaList.forEach((item) => {
        formData.append('media', item.file);
      });

      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        // Limpa estado
        setCaption('');
        setLocation('');
        setSelectedMusic(null);
        setMediaList([]);
        onPostCreated?.(response.data.post);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao criar publicação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Publicação" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Upload drop area */}
        {mediaList.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-3xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-900/40 transition-colors group"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImagePlus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Selecione ou arraste fotos e vídeos
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Suporta JPG, PNG, WEBP, MP4 até 50MB (máximo 10 arquivos)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Grid de previews */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
              {mediaList.map((item, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group border border-slate-200 dark:border-slate-700"
                >
                  {item.isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                      <Film className="w-8 h-8 opacity-70" />
                      <video
                        src={item.previewUrl}
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        muted
                        playsInline
                      />
                    </div>
                  ) : (
                    <img
                      src={item.previewUrl}
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-md">
                    {idx + 1}/{mediaList.length}
                  </span>
                </div>
              ))}

              {mediaList.length < 10 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-brand-500 transition-colors"
                >
                  <ImagePlus className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Adicionar</span>
                </div>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Caption */}
        <Textarea
          label="Legenda"
          placeholder="Escreva algo sobre esta publicação... (hashtags e menções @usuario)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          maxLength={1000}
        />

        {/* Trilha Sonora / Música */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Trilha Sonora <span className="text-slate-400 font-normal">(opcional)</span>
            </label>

            {!selectedMusic ? (
              <button
                type="button"
                onClick={() => setShowMusicPicker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 dark:text-pink-400 text-xs font-bold transition-all cursor-pointer border border-pink-500/20 shadow-sm"
              >
                <Music className="w-3.5 h-3.5" />
                <span>Escolher Música</span>
              </button>
            ) : null}
          </div>

          {selectedMusic && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-brand-500/10 to-indigo-500/10 border border-pink-500/30">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 shadow-md">
                  {selectedMusic.coverUrl ? (
                    <img
                      src={selectedMusic.coverUrl}
                      alt={selectedMusic.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-pink-400">
                      <Disc className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
                    <Music className="w-3 h-3 text-pink-500 flex-shrink-0" />
                    <span className="truncate">{selectedMusic.title}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedMusic.artist}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMusicPicker(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMusic(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remover música"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <Input
          label="Localização (opcional)"
          placeholder="Ex: São Paulo, Brasil"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          leftIcon={<MapPin className="w-4 h-4" />}
          maxLength={100}
        />

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={mediaList.length === 0}>
            Compartilhar Publicação
          </Button>
        </div>
      </form>

      {/* Modal Selecionador de Músicas */}
      <MusicPickerModal
        isOpen={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        onSelect={(track) => setSelectedMusic(track)}
        selectedTrack={selectedMusic}
      />
    </Modal>
  );
};
