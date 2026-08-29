import React from 'react';

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 mb-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 space-y-2">
          <div className="w-28 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </div>

      {/* Media placeholder */}
      <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800/70 rounded-2xl mb-4" />

      {/* Actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Text lines */}
      <div className="space-y-2">
        <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>
    </div>
  );
};

export const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 mb-6 animate-pulse">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 space-y-4 text-center sm:text-left w-full">
          <div className="w-40 h-6 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto sm:mx-0" />
          <div className="flex justify-center sm:justify-start gap-6">
            <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="w-48 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto sm:mx-0" />
        </div>
      </div>
    </div>
  );
};
