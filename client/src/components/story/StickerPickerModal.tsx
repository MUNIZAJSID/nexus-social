import React, { useState } from 'react';
import { X, BarChart2, HelpCircle, Sparkles, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export interface DraftSticker {
  type: 'POLL' | 'QUESTION';
  question: string;
  options?: string[];
  posX?: number;
  posY?: number;
}

interface StickerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSticker: (sticker: DraftSticker) => void;
}

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  isOpen,
  onClose,
  onAddSticker,
}) => {
  const [selectedType, setSelectedType] = useState<'POLL' | 'QUESTION' | null>(null);
  const [question, setQuestion] = useState('');
  const [option1, setOption1] = useState('Sim');
  const [option2, setOption2] = useState('Não');

  if (!isOpen) return null;

  const handleSelectType = (type: 'POLL' | 'QUESTION') => {
    setSelectedType(type);
    if (type === 'POLL') {
      setQuestion('O que você acha?');
      setOption1('Sim');
      setOption2('Não');
    } else {
      setQuestion('Faça uma pergunta!');
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !question.trim()) return;

    if (selectedType === 'POLL') {
      onAddSticker({
        type: 'POLL',
        question: question.trim(),
        options: [option1.trim() || 'Sim', option2.trim() || 'Não'],
        posX: 50,
        posY: 50,
      });
    } else {
      onAddSticker({
        type: 'QUESTION',
        question: question.trim(),
        posX: 50,
        posY: 50,
      });
    }

    setSelectedType(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-pink-500 text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Figurinhas Interativas</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Enquetes e caixinhas de perguntas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Escolha do Tipo ou Edição */}
        {!selectedType ? (
          <div className="p-5 grid grid-cols-2 gap-3.5">
            {/* Opção 1: Enquete */}
            <div
              onClick={() => handleSelectType('POLL')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-brand-500 flex flex-col items-center gap-2.5 text-center cursor-pointer transition-all hover:scale-105 group shadow-sm"
            >
              <div className="p-3 rounded-2xl bg-brand-500/10 group-hover:bg-brand-500 text-brand-500 group-hover:text-white transition-colors">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Enquete</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Votação com porcentagem</p>
              </div>
            </div>

            {/* Opção 2: Caixinha de Perguntas */}
            <div
              onClick={() => handleSelectType('QUESTION')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-pink-500 flex flex-col items-center gap-2.5 text-center cursor-pointer transition-all hover:scale-105 group shadow-sm"
            >
              <div className="p-3 rounded-2xl bg-pink-500/10 group-hover:bg-pink-500 text-pink-500 group-hover:text-white transition-colors">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Perguntas</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Receba perguntas no story</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="p-5 flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {selectedType === 'POLL' ? 'Pergunta da Enquete' : 'Título da Caixinha'}
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: O que acharam?"
                maxLength={60}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-semibold"
              />
            </div>

            {selectedType === 'POLL' && (
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Opção 1
                  </label>
                  <input
                    type="text"
                    value={option1}
                    onChange={(e) => setOption1(e.target.value)}
                    maxLength={25}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Opção 2
                  </label>
                  <input
                    type="text"
                    value={option2}
                    onChange={(e) => setOption2(e.target.value)}
                    maxLength={25}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Voltar
              </button>
              <Button
                type="submit"
                disabled={!question.trim()}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-pink-600 text-white text-xs font-bold"
              >
                Adicionar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
