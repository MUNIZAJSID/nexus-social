import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarDesktop } from './SidebarDesktop';
import { BottomNavMobile } from './BottomNavMobile';
import { TopHeaderMobile } from './TopHeaderMobile';
import { RightSidebar } from './RightSidebar';
import { ToastContainer } from '../ui/ToastContainer';
import { CreatePostModal } from '../post/CreatePostModal';

export const Layout: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      <ToastContainer />

      {/* Sidebar Desktop */}
      <SidebarDesktop onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Top Header Mobile */}
      <TopHeaderMobile />

      {/* Conteúdo Principal */}
      <main className="flex-1 min-w-0 px-4 py-4 md:px-8 md:py-8 pb-20 md:pb-8 flex justify-center">
        <div className="w-full max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* Right Suggestions Sidebar (Apenas telas grandes) */}
      <RightSidebar />

      {/* Bottom Nav Mobile */}
      <BottomNavMobile onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Modal Global de Criação de Post */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => {
          // Atualiza página se necessário
          window.dispatchEvent(new CustomEvent('post_created'));
        }}
      />
    </div>
  );
};
