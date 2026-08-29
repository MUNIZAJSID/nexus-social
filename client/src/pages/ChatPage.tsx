import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageSquare } from 'lucide-react';
import { api } from '../api/client';
import { Conversation, Message } from '../types';

export const ChatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    searchParams.get('conversationId')
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const urlConvId = searchParams.get('conversationId');
    if (urlConvId && urlConvId !== activeConversationId) {
      setActiveConversationId(urlConvId);
    }
  }, [searchParams]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setSearchParams({ conversationId: id });
  };

  const handleBackToList = () => {
    setActiveConversationId(null);
    setSearchParams({});
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-3rem)] max-w-5xl mx-auto w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex select-none">
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
          isLoading={isLoading}
        />
      </div>

      {/* Janela de chat ativa */}
      <div
        className={`flex-1 h-full ${
          activeConversationId ? 'block' : 'hidden md:flex'
        }`}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBackToList}
            onNewMessageSent={(newMsg: Message) => {
              // Atualiza última mensagem na lista
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === activeConversation.id ? { ...c, lastMessage: newMsg } : c
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
              Envie fotos, mensagens privadas e converse em tempo real com amigos conectados na rede local.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
