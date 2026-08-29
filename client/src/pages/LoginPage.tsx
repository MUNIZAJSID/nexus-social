import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  User,
  ShieldCheck,
  Plane,
  Gamepad2,
  Car,
  Wifi,
  Radio,
  Zap,
  Globe,
  Server,
  Settings,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { api, getBackendBaseUrl, setBackendBaseUrl } from '../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showServerModal, setShowServerModal] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(getBackendBaseUrl());
  const [serverSaved, setServerSaved] = useState(false);

  const handleSaveServer = (e: React.FormEvent) => {
    e.preventDefault();
    setBackendBaseUrl(customServerUrl);
    setServerSaved(true);
    setTimeout(() => {
      setServerSaved(false);
      setShowServerModal(false);
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Preencha seu usuário/email e sua senha.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao entrar. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { identifier: user, password: pass });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#060911] text-slate-100 relative overflow-hidden select-none">
      {/* Luzes de Fundo e Gradientes Espetaculares */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[160px] pointer-events-none" />

      <div className="w-full max-w-lg flex flex-col gap-6 relative z-10">
        {/* Logo & Header NEXUS */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-brand-500/35 mb-1 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-brand-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              NEXUS
            </h1>
            <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mt-1">
              Social Universe • Servidor Local
            </p>
          </div>
        </div>

        {/* Card do Formulário */}
        <div className="bg-[#0e1424]/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-100 mb-1">
              Acesse sua conta
            </h2>

            <Input
              label="Usuário ou Email"
              placeholder="Ex: seu_usuario ou email@exemplo.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              autoComplete="username"
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              autoComplete="current-password"
              required
            />

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <Button type="submit" isLoading={isLoading} className="mt-2 w-full bg-gradient-to-r from-brand-600 via-indigo-600 to-pink-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-brand-500/25">
              Entrar no Universo
            </Button>
          </form>

          {/* Atalhos para Contas de Demonstração */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Acesso Rápido de Testes
              </p>
              <span className="text-[10px] text-slate-500 font-mono">1-Clique</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="truncate">@admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('wanderlust.maya', '123456')}
                className="p-2.5 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Plane className="w-4 h-4 text-teal-400" />
                <span className="truncate">@wanderlust.maya</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('valkyrie.gg', '123456')}
                className="p-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span className="truncate">@valkyrie.gg</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('turbo.beast', '123456')}
                className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all flex items-center gap-2"
              >
                <Car className="w-4 h-4 text-rose-400" />
                <span className="truncate">@turbo.beast</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-xs text-slate-400">
            Ainda não tem conta na rede?{' '}
            <Link
              to="/register"
              className="font-bold text-brand-400 hover:text-brand-300 hover:underline"
            >
              Criar minha conta agora
            </Link>
          </p>
        </div>

        {/* LAN Info Widget & Server Config Button */}
        <div className="flex flex-col items-center justify-center gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hospedado no seu PC • Acesso Multiusuário LAN</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomServerUrl(getBackendBaseUrl());
              setShowServerModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
          >
            <Server className="w-3 h-3 text-brand-400" />
            <span className="font-mono text-[10px] truncate max-w-[200px]">
              {getBackendBaseUrl()}
            </span>
          </button>
        </div>

        {/* Modal de Configuração do Servidor */}
        {showServerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-[#0e1424] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Endereço do Servidor</h3>
                    <p className="text-xs text-slate-400">Conecte o App ao seu computador</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowServerModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveServer} className="flex flex-col gap-3">
                <Input
                  label="URL do Backend"
                  placeholder="Ex: http://192.168.0.65:5000 ou https://...trycloudflare.com"
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  autoFocus
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomServerUrl('http://192.168.0.65:5000')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono"
                  >
                    Wi-Fi Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomServerUrl('https://singh-metres-economy-substance.trycloudflare.com')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono truncate"
                  >
                    Cloudflare
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowServerModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5"
                  >
                    {serverSaved ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Salvo!
                      </>
                    ) : (
                      'Salvar Conexão'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
