import React, { useState, useEffect } from 'react';
import {
  Users,
  Image,
  MessageSquare,
  HardDrive,
  Shield,
  Ban,
  Trash2,
  Download,
  Archive,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { api, getMediaUrl } from '../../api/client';
import { AdminStats, User, Post } from '../../types';

export const AdminStatsCards: React.FC<{ stats: AdminStats | null; isLoading: boolean }> = ({
  stats,
  isLoading,
}) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Publicações no Feed',
      value: stats.totalPosts,
      icon: Image,
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Mensagens Trocadas',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Espaço em Disco',
      value: stats.storage.mb,
      icon: HardDrive,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-2xl bg-gradient-to-tr ${card.color} text-white shadow-md`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-3">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export const AdminUsersTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (userId: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/block`);
      if (res.data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRole = async (userId: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`);
      if (res.data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Atenção: Todos os dados, posts e mensagens deste usuário serão excluídos permanentemente. Prosseguir?')) {
      return;
    }
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
          Gerenciamento de Usuários ({users.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Usuário</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Cargo</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Carregando lista de usuários...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{u.displayName}</p>
                      <p className="text-[11px] text-slate-500">@{u.username}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {u.email}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.isBlocked ? (
                      <span className="text-rose-500 font-bold flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> Bloqueado
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleRole(u.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={u.role === 'ADMIN' ? 'Rebaixar para Usuário' : 'Promover a Administrador'}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleBlock(u.id)}
                      className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        u.isBlocked ? 'text-emerald-500 hover:text-emerald-600' : 'text-amber-500 hover:text-amber-600'
                      }`}
                      title={u.isBlocked ? 'Desbloquear Conta' : 'Bloquear Conta'}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminBackupPanel: React.FC = () => {
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/backup/list');
      if (res.data.success) {
        setBackups(res.data.backups);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleGenerateBackup = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post('/backup/create');
      if (res.data.success) {
        fetchBackups();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Archive className="w-5 h-5 text-brand-500" />
            <span>Backups do Sistema</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gere pacotes ZIP contendo todo o banco de dados e arquivos de mídia (/storage).
          </p>
        </div>

        <Button onClick={handleGenerateBackup} isLoading={isGenerating}>
          <Archive className="w-4 h-4" />
          <span>Criar Backup Agora</span>
        </Button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {isLoading && backups.length === 0 ? (
          <p className="p-6 text-xs text-slate-400 text-center">Carregando backups...</p>
        ) : backups.length === 0 ? (
          <p className="p-6 text-xs text-slate-400 text-center">Nenhum backup gerado ainda.</p>
        ) : (
          backups.map((b) => (
            <div key={b.filename} className="p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate">
                  {b.filename}
                </p>
                <p className="text-[11px] text-slate-500">{b.size}</p>
              </div>

              <a
                href={`${api.defaults.baseURL}/backup/download/${b.filename}`}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-500/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar</span>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
