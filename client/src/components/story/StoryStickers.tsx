import React, { useState } from 'react';
import { BarChart2, HelpCircle, Send, Check, Sparkles, X } from 'lucide-react';
import { api } from '../../api/client';
import { StorySticker } from '../../types';

interface PollStickerProps {
  sticker: StorySticker;
  isOwner?: boolean | null;
  onVote?: (stickerId: string, optionIndex: number) => void;
}

export const PollSticker: React.FC<PollStickerProps> = ({
  sticker,
  isOwner,
  onVote,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(
    sticker.userVote !== undefined ? sticker.userVote : null
  );
  const [voteCounts, setVoteCounts] = useState<number[]>(
    sticker.voteCounts || [0, 0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = sticker.options && sticker.options.length > 0 ? sticker.options : ['Sim', 'Não'];
  const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
  const hasVoted = selectedOption !== null;

  const handleVote = async (index: number) => {
    if (isOwner || hasVoted || isSubmitting) return;

    setSelectedOption(index);
    setIsSubmitting(true);

    // Atualização otimista
    const newCounts = [...voteCounts];
    newCounts[index] = (newCounts[index] || 0) + 1;
    setVoteCounts(newCounts);

    try {
      const res = await api.post(`/stories/stickers/${sticker.id}/vote`, {
        voteIndex: index,
      });
      if (res.data.success && Array.isArray(res.data.voteCounts)) {
        setVoteCounts(res.data.voteCounts);
      }
      onVote?.(sticker.id, index);
    } catch (err) {
      console.error('Erro ao votar:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-[260px] p-3.5 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/30 shadow-2xl text-slate-900 dark:text-white select-none animate-in zoom-in-95 duration-150 pointer-events-auto"
    >
      {/* Título / Pergunta da Enquete */}
      <div className="flex items-center justify-center gap-1.5 mb-2.5 text-center">
        <BarChart2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
        <h4 className="text-xs font-black leading-tight text-center">
          {sticker.question || 'O que você acha?'}
        </h4>
      </div>

      {/* Opções de Voto */}
      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => {
          const count = voteCounts[idx] || 0;
          const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isChosen = selectedOption === idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleVote(idx)}
              disabled={hasVoted || Boolean(isOwner)}
              className={`relative overflow-hidden w-full py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border ${
                isChosen
                  ? 'border-brand-500 shadow-md shadow-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-300'
              } ${hasVoted || isOwner ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
            >
              {/* Barra de Porcentagem Preenchida */}
              {(hasVoted || isOwner) && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isChosen
                      ? 'bg-brand-500/25 dark:bg-brand-500/35'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              )}

              {/* Texto da Opção */}
              <span className="relative z-10 truncate font-bold">
                {opt}
              </span>

              {/* Porcentagem ou Checkmark */}
              <span className="relative z-10 flex items-center gap-1 text-[11px] font-black">
                {hasVoted || isOwner ? (
                  <>
                    <span>{percent}%</span>
                    {isChosen && <Check className="w-3.5 h-3.5 text-brand-500 stroke-[3]" />}
                  </>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rodapé informativo */}
      {(hasVoted || isOwner) && (
        <div className="mt-2 text-center text-[10px] font-semibold text-slate-400">
          {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} no total
        </div>
      )}
    </div>
  );
};

interface QuestionStickerProps {
  sticker: StorySticker;
  isOwner?: boolean | null;
}

export const QuestionSticker: React.FC<QuestionStickerProps> = ({
  sticker,
  isOwner,
}) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(Boolean(sticker.userAnswer));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isOwner || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/stories/stickers/${sticker.id}/answer`, {
        answerText: answer.trim(),
      });
      if (res.data.success) {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Erro ao enviar resposta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-[270px] p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/30 shadow-2xl text-slate-900 dark:text-white select-none animate-in zoom-in-95 duration-150 pointer-events-auto"
    >
      {/* Header da Caixinha */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-center shadow-md mb-3">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
            Faça uma pergunta
          </span>
        </div>
        <h4 className="text-xs font-black leading-tight">
          {sticker.question || 'Manda sua pergunta aqui!'}
        </h4>
      </div>

      {/* Input de Resposta ou Confirmação */}
      {isSubmitted ? (
        <div className="py-2 px-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Pergunta enviada com sucesso!</span>
        </div>
      ) : isOwner ? (
        <div className="text-center text-[11px] font-semibold text-slate-400 py-1">
          {sticker.answers?.length || 0} {sticker.answers?.length === 1 ? 'resposta recebida' : 'respostas recebidas'}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Digite sua resposta..."
            maxLength={100}
            className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 font-medium"
          />
          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-brand-500 text-white disabled:opacity-50 transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
