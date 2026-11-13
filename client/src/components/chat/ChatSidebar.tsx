import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquarePlus, Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Conversation } from '../../types';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartNewChat?: () => void;
  isLoading: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onStartNewChat,
  isLoading,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const partner = conv.otherMembers[0];
    return (
      partner?.displayName?.toLowerCase().includes(q) ||
      partner?.username?.toLowerCase().includes(q) ||
      conv.name?.toLowerCase().includes(q)
    );
  });

  const getMediaPreviewLabel = (mediaType?: string | null) => {
    if (mediaType === 'AUDIO') return '🎵 Mensagem de voz';
    if (mediaType === 'VIDEO') return '🎥 Vídeo';
    if (mediaType === 'STORY_REPLY') return '📸 Respondeu ao story';
    return '📷 Foto / Mídia';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
            Mensagens
          </h2>
          {onStartNewChat && (
            <button
              type="button"
              onClick={onStartNewChat}
              className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-colors cursor-pointer"
              title="Nova conversa"
              aria-label="Nova conversa"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          )}
        </div>

        {conversations.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar conversas..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoading && conversations.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">Carregando conversas...</p>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhuma conversa aberta ainda. Comece uma conversa em tempo real!
            </p>
            {onStartNewChat && (
              <button
                type="button"
                onClick={onStartNewChat}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-brand-500/20"
              >
                Nova Conversa
              </button>
            )}
          </div>
        ) : filteredConversations.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            Nenhuma conversa corresponde a &ldquo;{searchFilter}&rdquo;.
          </p>
        ) : (
          filteredConversations.map((conv) => {
            const partner = conv.otherMembers[0];
            const isActive = activeConversationId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-brand-500/10 dark:bg-brand-500/15'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="relative">
                  <Avatar
                    src={partner?.avatarUrl}
                    name={partner?.displayName || 'Chat'}
                    size="md"
                    isOnline={partner?.isOnline}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {partner?.displayName || conv.name || 'Conversa'}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
                      {conv.lastMessage ? (
                        conv.lastMessage.content ? (
                          conv.lastMessage.content
                        ) : conv.lastMessage.mediaUrl ? (
                          getMediaPreviewLabel(conv.lastMessage.mediaType)
                        ) : (
                          'Mensagem'
                        )
                      ) : (
                        'Inicie a conversa...'
                      )}
                    </p>

                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="ml-2 min-w-[18px] h-[18px] px-1 bg-brand-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
