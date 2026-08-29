import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, User, Mail, AtSign, Wifi } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !displayName || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', {
        username,
        displayName,
        email,
        password,
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao criar conta. Verifique os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#060911] text-slate-100 relative overflow-hidden select-none">
      {/* Background Lights */}
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/20 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg flex flex-col gap-6 relative z-10">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-brand-500/35 mb-1 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-brand-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              NEXUS
            </h1>
            <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mt-1">
              Crie seu perfil no universo
            </p>
          </div>
        </div>

        {/* Card do Formulário */}
        <div className="bg-[#0e1424]/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-100 mb-1">
              Criar nova conta
            </h2>

            <Input
              label="Nome de Usuário (@handle)"
              placeholder="Ex: joao.silva"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              leftIcon={<AtSign className="w-4 h-4 text-slate-400" />}
              autoComplete="username"
              required
            />

            <Input
              label="Nome Completo / Exibição"
              placeholder="Ex: João da Silva"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              autoComplete="email"
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              autoComplete="new-password"
              required
            />

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <Button
              type="submit"
              isLoading={isLoading}
              className="mt-2 w-full bg-gradient-to-r from-brand-600 via-indigo-600 to-pink-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-brand-500/25"
            >
              Cadastrar Conta
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-xs text-slate-400">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="font-bold text-brand-400 hover:text-brand-300 hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multiusuário • Acesso Local & LAN</span>
        </div>
      </div>
    </div>
  );
};
