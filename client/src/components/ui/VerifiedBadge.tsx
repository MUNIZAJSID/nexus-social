import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const checkSizeClasses = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-2.5 h-2.5',
  lg: 'w-3.5 h-3.5',
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'sm', className = '' }) => {
  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/30 ${sizeClasses[size]} ${className}`}
      title="Conta Verificada Oficial"
    >
      <Check className={`${checkSizeClasses[size]} stroke-[3.5px]`} />
    </span>
  );
};
