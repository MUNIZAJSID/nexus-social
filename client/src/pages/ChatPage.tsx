import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { MessageSquare, Search, Loader2, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../api/client';
import { Conversation, Message, User } from '../types';

export const ChatPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { socket, setUnreadMessagesCount, refreshUnreadMessagesCount } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    searchParams.get('conversationId')
  );
  const [isLoading, setIsLoading] = useState(true);

  // Modal Nova Conversa
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [candidateUsers, setCandidateUsers] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        const list: Conversation[] = res.data.conversations;
        setConversations(list);
        const total = list.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [setUnreadMessagesCount]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const urlConvId = searchParams.get('conversationId');
    if (urlConvId && urlConvId !== activeConversationId) {
      setActiveConversationId(urlConvId);
    }
  }, [searchParams, activeConversationId]);

  // Atualização em tempo real da lista de conversas via Socket
  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = ({
      conversationId,
      lastMessage,
    }: {
      conversationId: string;
      lastMessage: Message;
    }) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (!exists) {
          fetchConversations();
          return prev;
        }

        const isViewing = activeConversationId === conversationId;
        const isFromOther = lastMessage?.senderId !== currentUser?.id;

        const updated = prev.map((c) => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            lastMessage,
            updatedAt: lastMessage?.createdAt || new Date().toISOString(),
            unreadCount: isViewing
              ? 0
              : isFromOther
              ? (c.unreadCount || 0) + 1
              : c.unreadCount || 0,
          };
        });

        return updated.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);
    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
    };
  }, [socket, activeConversationId, currentUser?.id, fetchConversations]);

  // Busca usuários sugeridos ou por pesquisa ao abrir "Nova Conversa"
  useEffect(() => {
    if (!isNewChatModalOpen) return;

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        if (userQuery.trim().length >= 2) {
          const res = await api.get(`/search?q=${encodeURIComponent(userQuery.trim())}`);
          if (res.data.success) {
            setCandidateUsers(
              (res.data.users || []).filter((u: User) => u.id !== currentUser?.id)
            );
          }
        } else {
          const res = await api.get('/users/suggested');
          if (res.data.success) {
            setCandidateUsers(
              (res.data.suggestions || []).filter((u: User) => u.id !== currentUser?.id)
            );
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [isNewChatModalOpen, userQuery, currentUser?.id]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setSearchParams({ conversationId: id });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    setTimeout(() => {
      refreshUnreadMessagesCount();
    }, 400);
  };

  const handleBackToList = () => {
    setActiveConversationId(null);
    setSearchParams({});
  };

  const handleStartConversationWithUser = async (targetUser: User) => {
    setStartingUserId(targetUser.id);
    try {
      const res = await api.post(`/chat/conversations/direct/${targetUser.id}`);
      if (res.data.success && res.data.conversation) {
        const convId = res.data.conversation.id;
        await fetchConversations();
        setIsNewChatModalOpen(false);
        setUserQuery('');
        handleSelectConversation(convId);
      }
    } catch (e) {
      console.error('Erro ao iniciar conversa:', e);
    } finally {
      setStartingUserId(null);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <>
      <div className="h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-4rem)] max-w-5xl mx-auto w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex select-none">
        {/* Sidebar de conversas */}
        <div
          className={`w-full md:w-80 lg:w-96 h-full ${
            activeConversationId ? 'hidden md:block' : 'block'
          }`}
        >
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onStartNewChat={() => setIsNewChatModalOpen(true)}
            isLoading={isLoading}
          />
        </div>

        {/* Janela de chat ativa */}
        <div
          className={`flex-1 min-w-0 h-full ${
            activeConversationId ? 'block' : 'hidden md:flex'
          }`}
        >
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onBack={handleBackToList}
              onNewMessageSent={(newMsg: Message) => {
                setConversations((prev) =>
                  prev
                    .map((c) =>
                      c.id === activeConversation.id
                        ? { ...c, lastMessage: newMsg, updatedAt: newMsg.createdAt, unreadCount: 0 }
                        : c
                    )
                    .sort(
                      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    )
                );
              }}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full w-full p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
              <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Suas Mensagens Diretas
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Envie fotos, áudios, chamadas e converse em tempo real com seus amigos.
              </p>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-brand-500/20"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Nova Conversa</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Nova Conversa"
        maxWidth="md"
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Buscar por nome ou @usuario..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5">
            {isSearchingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              </div>
            ) : candidateUsers.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Nenhum usuário encontrado.
              </p>
            ) : (
              candidateUsers.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  disabled={startingUserId === candidate.id}
                  onClick={() => handleStartConversationWithUser(candidate)}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={candidate.avatarUrl} name={candidate.displayName} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {candidate.displayName}
                        </span>
                        {candidate.isVerified && <VerifiedBadge size="xs" />}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">@{candidate.username}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">
                    {startingUserId === candidate.id ? 'Abrindo...' : 'Conversar'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
