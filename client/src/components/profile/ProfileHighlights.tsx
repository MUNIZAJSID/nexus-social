import React from 'react';
import { getMediaUrl } from '../../api/client';
import { Highlight } from '../../types';

interface ProfileHighlightsProps {
  highlights?: Highlight[];
}

export const ProfileHighlights: React.FC<ProfileHighlightsProps> = ({ highlights = [] }) => {
  if (highlights.length === 0) return null;

  return (
    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 my-2 select-none">
      {highlights.map((h) => (
        <div
          key={h.id}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] border-2 border-slate-300 dark:border-slate-700 group-hover:border-brand-500 transition-colors overflow-hidden">
            <img
              src={getMediaUrl(h.coverUrl)}
              alt={h.title}
              className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[76px] text-center">
            {h.title}
          </span>
        </div>
      ))}
    </div>
  );
};
