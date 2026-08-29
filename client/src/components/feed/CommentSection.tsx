import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, Trash2, CornerDownRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { api } from '../../api/client';
import { Comment } from '../../types';

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onCommentCountChange,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/comments/post/${postId}`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (e) {
      console.error('Erro ao carregar comentários:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/comments/post/${postId}`, {
        content: newComment,
        parentId: replyingTo?.id || null,
      });

      if (res.data.success) {
        setNewComment('');
        setReplyingTo(null);
        fetchComments();
        onCommentCountChange?.(res.data.commentsCount);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.data.success) {
        fetchComments();
        onCommentCountChange?.(res.data.commentsCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* Comments List */}
      <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1">
        {isLoading && comments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">Carregando comentários...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-2">
              {/* Main comment */}
              <div className="flex items-start justify-between group gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <Avatar src={comment.user.avatarUrl} name={comment.user.displayName} size="xs" />
                  <div className="text-xs leading-relaxed min-w-0">
                    <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">
                      @{comment.user.username}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 break-words">
                      {comment.content}
                    </span>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span>
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      {user && (
                        <button
                          onClick={() => setReplyingTo(comment)}
                          className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Responder
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {(user?.id === comment.userId || user?.role === 'ADMIN') && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-8 flex flex-col gap-2 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="flex items-start justify-between group gap-2.5"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <Avatar src={reply.user.avatarUrl} name={reply.user.displayName} size="xs" />
                        <div className="text-xs leading-relaxed min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">
                            @{reply.user.username}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 break-words">
                            {reply.content}
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                            <span>
                              {formatDistanceToNow(new Date(reply.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(user?.id === reply.userId || user?.role === 'ADMIN') && (
                        <button
                          onClick={() => handleDeleteComment(reply.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input bar */}
      {user ? (
        <form onSubmit={handleAddComment} className="flex flex-col gap-1.5">
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-1 bg-brand-500/10 rounded-lg text-xs text-brand-600 dark:text-brand-400">
              <span className="flex items-center gap-1.5 truncate">
                <CornerDownRight className="w-3.5 h-3.5" />
                Respondendo a <b>@{replyingTo.user.username}</b>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-0.5 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={replyingTo ? `Responder @${replyingTo.user.username}...` : 'Adicione um comentário...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-center text-slate-400">
          Faça login para comentar nesta publicação.
        </p>
      )}
    </div>
  );
};
