import axios from 'axios';

// Determina dinamicamente a URL base da API a partir do host do navegador ou configuração mobile
export function getBackendBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  
  // Se houver uma URL customizada configurada pelo usuário (ex: no app mobile)
  const customUrl = localStorage.getItem('localsocial_server_url');
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '');
  }

  // Se houver variável de ambiente configurada na Vercel / Produção
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).trim().replace(/\/+$/, '');
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Se estiver rodando dentro do Capacitor (Android/iOS)
  if (protocol === 'capacitor:' || protocol === 'ionic:') {
    return customUrl || 'http://192.168.0.65:5000';
  }

  // Se estiver usando proxy Vite na porta 3000 em dev ou produção com mesmo host
  if (window.location.port === '3000') {
    return `${protocol}//${hostname}:5000`;
  }
  return `${protocol}//${window.location.host}`;
}

export function setBackendBaseUrl(url: string) {
  if (url) {
    localStorage.setItem('localsocial_server_url', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('localsocial_server_url');
  }
}

export const api = axios.create({
  baseURL: `${getBackendBaseUrl()}/api`,
  timeout: 30000,
});

// Atualiza o baseURL dinamicamente em cada requisição caso a URL mude
api.interceptors.request.use((config) => {
  config.baseURL = `${getBackendBaseUrl()}/api`;
  return config;
});

// Interceptor para injetar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('localsocial_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para lidar com respostas de erro (ex: 401 não autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se não for rota de login/register, pode limpar sessão se token expirou
      const isAuthRoute = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isAuthRoute && localStorage.getItem('localsocial_token')) {
        localStorage.removeItem('localsocial_token');
        localStorage.removeItem('localsocial_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Retorna o link absoluto de uma mídia do storage local ou URL externa
 */
export function getMediaUrl(mediaPath?: string | null): string {
  if (!mediaPath) return '';
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://') || mediaPath.startsWith('data:')) {
    return mediaPath;
  }
  const backendBase = getBackendBaseUrl();
  const cleanPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
  return `${backendBase}${cleanPath}`;
}
