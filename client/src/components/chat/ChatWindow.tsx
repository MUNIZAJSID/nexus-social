import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Send, Image, X, ArrowLeft, Loader2, Phone, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../ui/Avatar';
import { VoiceRecorder } from './VoiceRecorder';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { api, getMediaUrl } from '../../api/client';
import { Conversation, Message } from '../../types';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
  onNewMessageSent?: (msg: Message) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onBack,
  onNewMessageSent,
}) => {
  const { user } = useAuth();
  const { socket, isUserOnline, joinConversation, leaveConversation, emitTypingStart, emitTypingStop } =
    useSocket();
  const { startCall } = useCall();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const partner = conversation.otherMembers[0];
  const isOnline = partner ? isUserOnline(partner.id) : false;

  // Carrega histórico de mensagens e entra na sala Socket
  useEffect(() => {
    setIsLoading(true);
    joinConversation(conversation.id);

    api.get(`/chat/conversations/${conversation.id}/messages`)
      .then((res) => {
        if (res.data.success) {
          setMessages(res.data.messages);
        }
      })
      .catch((err) => console.error('Erro ao carregar mensagens:', err))
      .finally(() => setIsLoading(false));

    return () => {
      leaveConversation(conversation.id);
    };
  }, [conversation.id]);

  // Listener para novas mensagens recebidas no Socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === conversation.id) {
        setMessages((prev) => {
          // Evita duplicatas se já adicionado localmente
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTyping = (data: { conversationId: string; userId: string; username: string; isTyping: boolean }) => {
      if (data.conversationId === conversation.id && data.userId !== user?.id) {
        setTypingUser(data.isTyping ? data.username : null);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, conversation.id, user?.id]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!user) return;

    emitTypingStart(conversation.id, user.username);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(conversation.id);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    setIsSending(true);
    emitTypingStop(conversation.id);

    try {
      const formData = new FormData();
      if (inputText.trim()) formData.append('content', inputText.trim());
      if (selectedFile) formData.append('media', selectedFile);

      const res = await api.post(`/chat/conversations/${conversation.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.message) {
        setInputText('');
        handleRemoveFile();
        onNewMessageSent?.(res.data.message);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoice = async (audioFile: File) => {
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('media', audioFile);

      const res = await api.post(`/chat/conversations/${conversation.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.message) {
        onNewMessageSent?.(res.data.message);
      }
    } catch (err) {
      console.error('Erro ao enviar áudio:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#090d16] select-none">
      {/* Header */}
      <header className="px-4 py-3 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <Link to={partner ? `/profile/${partner.username}` : '#'} className="flex items-center gap-3 min-w-0">
            <Avatar src={partner?.avatarUrl} name={partner?.displayName || 'U'} size="sm" isOnline={isOnline} />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {partner?.displayName || conversation.name || 'Chat'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isOnline ? (
                  <span className="text-emerald-500 font-semibold">Online agora</span>
                ) : (
                  partner ? `@${partner.username}` : ''
                )}
              </p>
            </div>
          </Link>
        </div>

        {/* Botões de Chamada de Voz e Vídeo */}
        {partner && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => startCall(partner.id, partner, false, conversation.id)}
              className="p-2 text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Iniciar chamada de voz"
            >
              <Phone className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => startCall(partner.id, partner, true, conversation.id)}
              className="p-2 text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Iniciar chamada de vídeo"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Avatar src={partner?.avatarUrl} name={partner?.displayName} size="xl" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-3">
              {partner?.displayName}
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Inicie uma conversa privada em tempo real com este usuário.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm break-words leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none'
                  }`}
                >
                  {/* Media attachment */}
                  {msg.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden max-w-sm">
                      {msg.mediaType === 'STORY_REPLY' ? (
                        <div className="p-2 rounded-xl bg-black/20 border border-white/15 flex items-center gap-2.5">
                          <div className="w-10 h-14 rounded-lg overflow-hidden bg-black flex-shrink-0 shadow-inner">
                            {msg.mediaUrl.endsWith('.mp4') || msg.mediaUrl.endsWith('.webm') ? (
                              <video src={getMediaUrl(msg.mediaUrl)} className="w-full h-full object-cover" />
                            ) : (
                              <img src={getMediaUrl(msg.mediaUrl)} alt="Story" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                              {isMe ? 'Você respondeu ao story' : 'Respondeu ao seu story'}
                            </span>
                            <span className="text-xs font-semibold truncate opacity-95">
                              Story 📸
                            </span>
                          </div>
                        </div>
                      ) : msg.mediaType === 'AUDIO' ? (
                        <AudioMessagePlayer audioUrl={msg.mediaUrl} isSelf={isMe} />
                      ) : msg.mediaType === 'VIDEO' ? (
                        <video src={getMediaUrl(msg.mediaUrl)} controls className="w-full rounded-xl" />
                      ) : (
                        <img
                          src={getMediaUrl(msg.mediaUrl)}
                          alt="Anexo"
                          className="w-full rounded-xl object-cover max-h-64"
                        />
                      )}
                    </div>
                  )}

                  {msg.content && <p>{msg.content}</p>}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </span>
              </div>
            );
          })
        )}

        {/* Indicador de digitando */}
        {typingUser && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-ping" />
            <span>{typingUser} está digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800">
        {/* Preview do anexo selecionado */}
        {previewUrl && (
          <div className="relative inline-block mb-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <img src={previewUrl} alt="Preview anexo" className="w-20 h-20 object-cover rounded-lg" />
            <button
              onClick={handleRemoveFile}
              className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0 cursor-pointer"
            title="Anexar imagem ou vídeo"
          >
            <Image className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Gravador de Mensagem de Voz */}
          <VoiceRecorder onSendVoice={handleSendVoice} disabled={isSending} />

          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <button
            type="submit"
            disabled={isSending || (!inputText.trim() && !selectedFile)}
            className="p-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-2xl disabled:opacity-50 transition-all shadow-md shadow-brand-500/20 active:scale-95 flex-shrink-0 cursor-pointer"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
