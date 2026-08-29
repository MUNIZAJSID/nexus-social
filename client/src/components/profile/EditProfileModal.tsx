import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { Camera, Lock, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { User } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdated?: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}) => {
  const { updateUserLocal } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [isPrivate, setIsPrivate] = useState(user.isPrivate);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setAvatarUrl(res.data.avatarUrl);
        updateUserLocal({ avatarUrl: res.data.avatarUrl });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar foto de perfil.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.patch('/users/profile', {
        displayName,
        bio,
        isPrivate,
      });

      if (res.data.success) {
        updateUserLocal(res.data.user);
        onProfileUpdated?.(res.data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar alterações do perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil" maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Avatar Upload Container */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <Avatar src={avatarUrl} name={displayName} size="xl" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            {isUploadingAvatar ? 'Enviando...' : 'Alterar foto de perfil'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Display Name */}
        <Input
          label="Nome de Exibição"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          required
        />

        {/* Bio */}
        <Textarea
          label="Biografia"
          placeholder="Conte um pouco sobre você..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={250}
          rows={3}
        />

        {/* Privacy toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {isPrivate ? (
              <Lock className="w-5 h-5 text-amber-500" />
            ) : (
              <Globe className="w-5 h-5 text-brand-500" />
            )}
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Conta Privada
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isPrivate
                  ? 'Apenas pessoas aprovadas por você podem ver suas fotos.'
                  : 'Qualquer pessoa na rede pode ver suas publicações.'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
};
