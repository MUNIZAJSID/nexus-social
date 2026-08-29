import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PostCard } from '../components/feed/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { api } from '../api/client';
import { Post } from '../types';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [otherPosts, setOtherPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    setError('');

    api.get(`/posts/${postId}`)
      .then((res) => {
        if (res.data.success) {
          const mainPost = res.data.post;
          setPost(mainPost);

          // Carrega as outras publicações do mesmo autor para rolagem contínua
          if (mainPost?.user?.username) {
            api.get(`/posts/user/${mainPost.user.username}`)
              .then((userPostsRes) => {
                if (userPostsRes.data.success) {
                  const filtered = userPostsRes.data.posts.filter((p: Post) => p.id !== mainPost.id);
                  setOtherPosts(filtered);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Publicação não encontrada.');
      })
      .finally(() => setIsLoading(false));
  }, [postId]);

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors w-fit p-1 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      {isLoading ? (
        <PostCardSkeleton />
      ) : error || !post ? (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            {error || 'Publicação não encontrada'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Esta publicação pode ter sido excluída ou você não tem permissão para visualizá-la.
          </p>
        </div>
      ) : (
        <>
          {/* Post Principal */}
          <PostCard post={post} onPostDeleted={() => navigate('/')} />

          {/* Outras publicações do autor para rolagem contínua */}
          {otherPosts.length > 0 && (
            <div className="flex flex-col gap-5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Mais publicações de @{post.user.username}
                </span>
              </div>

              <div className="flex flex-col gap-6">
                {otherPosts.map((otherPost) => (
                  <PostCard
                    key={otherPost.id}
                    post={otherPost}
                    onPostDeleted={(deletedId) => {
                      setOtherPosts((prev) => prev.filter((p) => p.id !== deletedId));
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
