import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Archive, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  AdminStatsCards,
  AdminUsersTable,
  AdminBackupPanel,
} from '../components/admin/AdminComponents';
import { api } from '../api/client';
import { AdminStats } from '../types';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'backups'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      setIsLoading(true);
      api.get('/admin/overview')
        .then((res) => {
          if (res.data.success) {
            setStats(res.data.stats);
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setIsLoading(false));
    }
  }, [isAdmin]);

  if (authLoading) return null;
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle do servidor local, usuários, moderação e integridade do banco de dados.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários</span>
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'backups'
                ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Backups</span>
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <AdminStatsCards stats={stats} isLoading={isLoading} />
          <AdminUsersTable />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && <AdminUsersTable />}

      {/* Backups Tab */}
      {activeTab === 'backups' && <AdminBackupPanel />}
    </div>
  );
};
