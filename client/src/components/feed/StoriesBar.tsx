import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { StoryViewerModal } from './StoryViewerModal';
import { CreateStoryModal } from './CreateStoryModal';
import { api } from '../../api/client';
import { StoryGroup } from '../../types';

export const StoriesBar: React.FC = () => {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchStories = useCallback(() => {
    api.get('/stories/feed')
      .then((res) => {
        if (res.data.success) {
          setStoryGroups(res.data.stories);
        }
      })
      .catch((e) => console.error('Erro ao carregar stories:', e));
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const myGroupIndex = storyGroups.findIndex((g) => g.user.id === user?.id);
  const myStoryGroup = myGroupIndex !== -1 ? storyGroups[myGroupIndex] : null;

  return (
    <section className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm select-none">
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-1">
        {/* Adicionar / Ver Story do Usuário Atual */}
        {user && (
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="relative">
              <div
                onClick={() => {
                  if (myStoryGroup) {
                    setActiveStoryIdx(myGroupIndex);
                  } else {
                    setIsCreateOpen(true);
                  }
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] cursor-pointer transition-all duration-200 ${
                  myStoryGroup
                    ? 'bg-gradient-to-tr from-brand-500 via-indigo-500 to-pink-500 shadow-md group-hover:scale-105'
                    : 'border-2 border-dashed border-slate-300 dark:border-slate-700 group-hover:border-brand-500 flex items-center justify-center'
                }`}
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-[#0f172a] p-0.5 flex items-center justify-center overflow-hidden">
                  <Avatar src={user.avatarUrl} name={user.displayName} size="md" />
                </div>
              </div>

              {/* Botão de + para adicionar novo Story */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateOpen(true);
                }}
                title="Publicar novo Story"
                className="absolute -bottom-1 -right-1 p-1 bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[64px]">
              {myStoryGroup ? 'Seu Story' : 'Criar Story'}
            </span>
          </div>
        )}

        {/* Stories dos Outros Usuários */}
        {storyGroups
          .map((group, idx) => ({ group, originalIdx: idx }))
          .filter(({ group }) => group.user.id !== user?.id)
          .map(({ group, originalIdx }) => (
            <div
              key={group.user.id}
              onClick={() => setActiveStoryIdx(originalIdx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div
                className={`p-[2.5px] rounded-full group-hover:scale-105 transition-transform duration-200 shadow-sm ${
                  group.hasUnseen
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-brand-500 animate-pulse-subtle'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div className="p-0.5 rounded-full bg-white dark:bg-[#0f172a]">
                  <Avatar
                    src={group.user.avatarUrl}
                    name={group.user.displayName}
                    size="md"
                  />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[68px]">
                @{group.user.username}
              </span>
            </div>
          ))}
      </div>

      {/* Modal de Visualização de Stories */}
      {activeStoryIdx !== null && (
        <StoryViewerModal
          isOpen={activeStoryIdx !== null}
          onClose={() => {
            setActiveStoryIdx(null);
            fetchStories();
          }}
          storyGroups={storyGroups}
          initialGroupIndex={activeStoryIdx}
        />
      )}

      {/* Modal de Criação de Stories */}
      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onStoryCreated={() => {
          fetchStories();
        }}
      />
    </section>
  );
};
