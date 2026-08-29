import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquarePlus } from 'lucide-react';
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
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
          Mensagens
        </h2>
        {onStartNewChat && (
          <button
            onClick={onStartNewChat}
            className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-colors"
            title="Nova conversa"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoading && conversations.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">Carregando conversas...</p>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhuma conversa aberta ainda. Visite o perfil de alguém e clique em "Mensagem"!
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
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
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {partner?.displayName || conv.name || 'Conversa'}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
                      {conv.lastMessage ? (
                        conv.lastMessage.mediaUrl ? (
                          '📷 [Imagem / Mídia]'
                        ) : (
                          conv.lastMessage.content
                        )
                      ) : (
                        'Inicie a conversa...'
                      )}
                    </p>

                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="ml-2 w-4 h-4 bg-brand-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center">
                        {conv.unreadCount}
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
