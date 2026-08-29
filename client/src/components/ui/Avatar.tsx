import React from 'react';
import { getMediaUrl } from '../../api/client';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base font-semibold',
  xl: 'w-20 h-20 text-xl font-bold',
  '2xl': 'w-28 h-28 text-3xl font-extrabold',
};

const badgeSizeClasses = {
  xs: 'w-2 h-2 border-[1px]',
  sm: 'w-2.5 h-2.5 border-[1.5px]',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
  '2xl': 'w-5 h-5 border-[3px]',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name = 'U',
  size = 'md',
  isOnline = false,
  className = '',
  onClick,
}) => {
  const mediaUrl = getMediaUrl(src);
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-shrink-0 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {src ? (
        <img
          src={mediaUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800`}
          onError={(e) => {
            // Fallback caso imagem quebre
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-medium ring-2 ring-slate-200 dark:ring-slate-800`}
        >
          {initials || 'U'}
        </div>
      )}

      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 border-white dark:border-slate-900 ring-1 ring-white dark:ring-slate-900 ${badgeSizeClasses[size]}`}
          title="Online agora"
        />
      )}
    </div>
  );
};
