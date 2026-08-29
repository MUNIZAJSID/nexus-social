import { io, Socket } from 'socket.io-client';
import { getBackendBaseUrl } from './client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function initializeSocket(token: string): Socket {
  if (socketInstance) {
    socketInstance.disconnect();
  }

  const backendUrl = getBackendBaseUrl();

  socketInstance = io(backendUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socketInstance.on('connect', () => {
    console.log('⚡ Conectado ao servidor WebSocket do LocalSocial!');
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('🔌 Desconectado do WebSocket:', reason);
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('⚠️ Erro de conexão no WebSocket:', err.message);
  });

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
