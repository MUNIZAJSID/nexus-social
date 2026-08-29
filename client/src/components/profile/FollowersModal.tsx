import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { UserPlus, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { User } from '../../types';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: 'followers' | 'following';
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  username,
  type,
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.get(`/users/${username}/${type}`)
        .then((res) => {
          if (res.data.success) {
            const list = res.data[type] || [];
            setUsers(list);
            const states: { [key: string]: boolean } = {};
            list.forEach((u: User) => {
              states[u.id] = !!u.isFollowing;
            });
            setFollowingStates(states);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, username, type]);

  const handleToggleFollow = async (targetId: string) => {
    try {
      const res = await api.post(`/follow/${targetId}`);
      if (res.data.success) {
        setFollowingStates((prev) => ({
          ...prev,
          [targetId]: res.data.action === 'FOLLOWED' || res.data.action === 'REQUESTED',
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'followers' ? 'Seguidores' : 'Seguindo'}
      maxWidth="md"
    >
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-6">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            {type === 'followers'
              ? 'Nenhum seguidor ainda.'
              : 'Não está seguindo ninguém ainda.'}
          </p>
        ) : (
          users.map((u) => {
            const isFollowing = followingStates[u.id];
            const isSelf = currentUser?.id === u.id;

            return (
              <div
                key={u.id}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
              >
                <Link
                  to={`/profile/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {u.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      @{u.username}
                    </p>
                  </div>
                </Link>

                {currentUser && !isSelf && (
                  <Button
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'primary'}
                    onClick={() => handleToggleFollow(u.id)}
                  >
                    {isFollowing ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Seguindo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" /> Seguir
                      </span>
                    )}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};
