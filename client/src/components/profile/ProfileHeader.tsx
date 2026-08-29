import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Edit3,
  UserPlus,
  Check,
  Clock,
  MessageCircle,
  Shield,
  Globe,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { Button } from '../ui/Button';
import { EditProfileModal } from './EditProfileModal';
import { FollowersModal } from './FollowersModal';
import { ProfileHighlights } from './ProfileHighlights';
import { api, getMediaUrl } from '../../api/client';
import { User } from '../../types';

interface ProfileHeaderProps {
  profile: User;
  onProfileUpdated?: (updated: User) => void;
}

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onProfileUpdated }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following' | null>(null);

  const [isFollowing, setIsFollowing] = useState(!!profile.isFollowing);
  const [hasRequested, setHasRequested] = useState(!!profile.hasRequestedFollow);
  const [followersCount, setFollowersCount] = useState(profile.counts?.followers || 0);

  const isSelf = currentUser?.id === profile.id;
  const isOnline = isUserOnline(profile.id);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/follow/${profile.id}`);
      if (res.data.success) {
        if (res.data.action === 'FOLLOWED') {
          setIsFollowing(true);
          setHasRequested(false);
          setFollowersCount((prev) => prev + 1);
        } else if (res.data.action === 'UNFOLLOWED') {
          setIsFollowing(false);
          setHasRequested(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
        } else if (res.data.action === 'REQUESTED') {
          setHasRequested(true);
        } else if (res.data.action === 'REQUEST_CANCELLED') {
          setHasRequested(false);
        }
      }
    } catch (e) {
      console.error('Erro ao seguir:', e);
    }
  };

  const handleStartChat = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/chat/conversations/direct/${profile.id}`);
      if (res.data.success && res.data.conversation) {
        navigate(`/chat?conversationId=${res.data.conversation.id}`);
      }
    } catch (e) {
      console.error('Erro ao abrir conversa:', e);
    }
  };

  return (
    <header className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm mb-6">
      {/* Capa de Perfil */}
      <div className="relative h-32 sm:h-44 w-full bg-gradient-to-r from-brand-600 via-indigo-600 to-pink-600">
        {profile.coverUrl && (
          <img
            src={getMediaUrl(profile.coverUrl)}
            alt="Capa de perfil"
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
          {/* Avatar com moldura */}
          <div className="relative p-1.5 rounded-full bg-white dark:bg-[#0f172a] shadow-xl">
            <Avatar
              src={profile.avatarUrl}
              name={profile.displayName}
              size="2xl"
              isOnline={isOnline}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
            {isSelf ? (
              <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Edit3 className="w-4 h-4" />
                <span>Editar Perfil</span>
              </Button>
            ) : (
              <>
                <Button
                  variant={isFollowing ? 'secondary' : hasRequested ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleToggleFollow}
                >
                  {isFollowing ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Seguindo
                    </span>
                  ) : hasRequested ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Solicitado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" /> Seguir
                    </span>
                  )}
                </Button>

                <Button variant="secondary" size="sm" onClick={handleStartChat}>
                  <MessageCircle className="w-4 h-4" />
                  <span>Mensagem</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Informações de Perfil */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {profile.displayName}
              </h2>
              {profile.isVerified && <VerifiedBadge size="md" />}
              {profile.role === 'ADMIN' && (
                <span className="flex items-center gap-1 text-[11px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> ADMIN
                </span>
              )}
              {profile.isPrivate && (
                <span className="flex items-center gap-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Privada
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              @{profile.username}
            </p>
          </div>

          {/* Biografia */}
          {profile.bio && (
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Website Link */}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline w-fit"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{profile.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {/* Estatísticas */}
          <div className="flex items-center gap-8 py-3.5 my-1 border-y border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 block">
                {profile.counts?.posts || 0}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">publicações</span>
            </div>

            <button
              onClick={() => setFollowersModalType('followers')}
              className="hover:opacity-75 transition-opacity text-left"
            >
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 block">
                {formatCount(followersCount)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">seguidores</span>
            </button>

            <button
              onClick={() => setFollowersModalType('following')}
              className="hover:opacity-75 transition-opacity text-left"
            >
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 block">
                {formatCount(profile.counts?.following || 0)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">seguindo</span>
            </button>
          </div>

          {/* Stories em Destaque (Highlights) */}
          <ProfileHighlights highlights={profile.highlights} />
        </div>
      </div>

      {/* Modais */}
      {isSelf && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={profile}
          onProfileUpdated={onProfileUpdated}
        />
      )}

      {followersModalType && (
        <FollowersModal
          isOpen={!!followersModalType}
          onClose={() => setFollowersModalType(null)}
          username={profile.username}
          type={followersModalType}
        />
      )}
    </header>
  );
};
