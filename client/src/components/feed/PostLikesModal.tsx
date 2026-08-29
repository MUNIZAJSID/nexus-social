import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, UserPlus, UserCheck } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { Button } from '../ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface LikeUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isVerified?: boolean;
  isFollowing?: boolean;
  isSelf?: boolean;
}

interface PostLikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export const PostLikesModal: React.FC<PostLikesModalProps> = ({
  isOpen,
  onClose,
  postId,
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<LikeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingFollowId, setLoadingFollowId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !postId) return;

    setIsLoading(true);
    api.get(`/likes/post/${postId}`)
      .then((res) => {
        if (res.data.success) {
          setUsers(res.data.users);
          const initialFollowMap: Record<string, boolean> = {};
          res.data.users.forEach((u: LikeUser) => {
            initialFollowMap[u.id] = !!u.isFollowing;
          });
          setFollowingMap(initialFollowMap);
        }
      })
      .catch((err) => console.error('Erro ao carregar curtidas:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, postId]);

  const handleToggleFollow = async (user: LikeUser) => {
    if (loadingFollowId) return;
    setLoadingFollowId(user.id);
    const wasFollowing = followingMap[user.id];

    // Optimistic
    setFollowingMap((prev) => ({ ...prev, [user.id]: !wasFollowing }));

    try {
      await api.post(`/follow/${user.username}`);
    } catch {
      setFollowingMap((prev) => ({ ...prev, [user.id]: wasFollowing }));
    } finally {
      setLoadingFollowId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-[#0e1424] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Curtidas na Publicação</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-2.5 max-h-80">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Carregando quem curtiu...
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center gap-2 text-slate-400">
              <Heart className="w-8 h-8 text-slate-700" />
              <p className="text-xs">Nenhuma curtida encontrada.</p>
            </div>
          ) : (
            users.map((likeUser) => {
              const isFollowing = followingMap[likeUser.id];
              const isSelf = currentUser?.id === likeUser.id || likeUser.isSelf;

              return (
                <div
                  key={likeUser.id}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-800/60 transition-colors"
                >
                  <Link
                    to={`/profile/${likeUser.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0 pr-2"
                  >
                    <Avatar
                      src={likeUser.avatarUrl}
                      name={likeUser.displayName}
                      size="sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {likeUser.displayName}
                        </span>
                        {likeUser.isVerified && <VerifiedBadge size="xs" />}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">
                        @{likeUser.username}
                      </span>
                    </div>
                  </Link>

                  {!isSelf && currentUser && (
                    <Button
                      size="sm"
                      variant={isFollowing ? 'secondary' : 'primary'}
                      isLoading={loadingFollowId === likeUser.id}
                      onClick={() => handleToggleFollow(likeUser)}
                      className={`text-[11px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 ${
                        isFollowing
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-brand-600 hover:bg-brand-500 text-white'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          Seguir
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
