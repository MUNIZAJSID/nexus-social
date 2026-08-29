import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Check, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { api, getMediaUrl } from '../../api/client';
import { Story } from '../../types';

interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHighlightCreated: () => void;
}

export const CreateHighlightModal: React.FC<CreateHighlightModalProps> = ({
  isOpen,
  onClose,
  onHighlightCreated,
}) => {
  const [title, setTitle] = useState('');
  const [availableStories, setAvailableStories] = useState<Story[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStories, setIsFetchingStories] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSelectedStoryIds([]);
      setSelectedCoverIndex(0);
      setError('');
      fetchUserStories();
    }
  }, [isOpen]);

  const fetchUserStories = async () => {
    setIsFetchingStories(true);
    try {
      const res = await api.get('/stories/feed');
      if (res.data.success && Array.isArray(res.data.stories)) {
        // Pega os stories do usuário atual
        const myGroup = res.data.stories.find((g: any) => g.stories.some((s: any) => s.isOwner));
        if (myGroup) {
          setAvailableStories(myGroup.stories);
        } else {
          setAvailableStories([]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar stories:', err);
    } finally {
      setIsFetchingStories(false);
    }
  };

  if (!isOpen) return null;

  const toggleSelectStory = (id: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe um título para o destaque.');
      return;
    }

    if (selectedStoryIds.length === 0) {
      setError('Selecione pelo menos um Story para incluir no destaque.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const selectedStories = availableStories.filter((s) => selectedStoryIds.includes(s.id));
      const coverUrl = selectedStories[selectedCoverIndex]?.mediaUrl || selectedStories[0]?.mediaUrl;

      const res = await api.post('/highlights', {
        title: title.trim(),
        coverUrl,
        storyIds: selectedStoryIds,
      });

      if (res.data.success) {
        onHighlightCreated();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao criar destaque.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Novo Destaque</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Fixe seus momentos favoritos no perfil</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário e Seleção */}
        <form onSubmit={handleSave} className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Campo de Título */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Destaque
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Viagens, Rolês, Vibe..."
              maxLength={25}
              autoFocus
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
            />
          </div>

          {/* Selecionar Stories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selecione os Stories ({selectedStoryIds.length})
              </label>
            </div>

            {isFetchingStories ? (
              <div className="py-8 text-center text-xs text-slate-400">Carregando seus stories...</div>
            ) : availableStories.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Nenhum story ativo encontrado</p>
                <p className="text-[11px] text-slate-400">Publique um story primeiro para poder fixá-lo como destaque!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {availableStories.map((story) => {
                  const isSelected = selectedStoryIds.includes(story.id);
                  return (
                    <div
                      key={story.id}
                      onClick={() => toggleSelectStory(story.id)}
                      className={`relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group ${
                        isSelected
                          ? 'border-amber-500 shadow-md shadow-amber-500/20 scale-[0.98]'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      {story.mediaType === 'VIDEO' ? (
                        <video
                          src={getMediaUrl(story.mediaUrl)}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      ) : (
                        <img
                          src={getMediaUrl(story.mediaUrl)}
                          alt="Story"
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Checkmark overlay */}
                      <div
                        className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-sm scale-110'
                            : 'bg-black/40 text-white/50 group-hover:bg-black/60'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={selectedStoryIds.length === 0 || !title.trim()}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-amber-500/25 transition-all"
            >
              Concluir Destaque
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
