import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Copy, Check, Share2, Wifi } from 'lucide-react';
import { Post } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, post }) => {
  const [copied, setCopied] = useState(false);

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${post.id}` : `/post/${post.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compartilhar Publicação" maxWidth="md">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Copie o link direto desta publicação para compartilhar com qualquer pessoa conectada à sua rede:
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={postUrl}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 select-all focus:outline-none"
          />
          <Button onClick={handleCopy} size="sm" variant={copied ? 'secondary' : 'primary'}>
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar</span>
              </>
            )}
          </Button>
        </div>

        <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-700 dark:text-brand-300 flex items-start gap-2.5">
          <Wifi className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Qualquer dispositivo (celular ou outro computador) na mesma rede Wi-Fi que abrir este link conseguirá visualizar e interagir!
          </span>
        </div>
      </div>
    </Modal>
  );
};
