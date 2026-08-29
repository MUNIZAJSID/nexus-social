import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env';
import { printServerBanner } from './config/network';
import { connectDB } from './db/prisma';
import { ensureStorageDirectoriesExist, STORAGE_PATHS } from './services/storage.service';
import { errorHandler } from './middlewares/error.middleware';
import apiRouter from './routes';
import { initSocketServer } from './socket/socket.handler';

async function bootstrap() {
  // 1. Garante que pastas de armazenamento local existam
  ensureStorageDirectoriesExist();

  // 2. Conecta ao banco de dados SQLite local
  await connectDB();

  // 3. Inicializa aplicação Express e Servidor HTTP
  const app = express();
  const server = http.createServer(app);

  // 4. Configuração de CORS aberto para qualquer computador da rede local
  app.use(
    cors({
      origin: true, // Permite qualquer origem (localhost, 192.168.x.x, ngrok, domínios)
      credentials: true,
    })
  );

  app.use(express.json({ limit: '150mb' }));
  app.use(express.urlencoded({ extended: true, limit: '150mb' }));

  // 5. Servir arquivos estáticos de mídia local (/storage/...)
  app.use('/storage', express.static(STORAGE_PATHS.root));

  // 6. Rotas da API REST
  app.use('/api', apiRouter);

  // Se o frontend tiver sido compilado em client/dist, serve estaticamente
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/storage') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // 7. Middleware de Erros
  app.use(errorHandler);

  // 8. Inicializa Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true,
    },
    maxHttpBufferSize: 5e7, // 50MB
  });

  initSocketServer(io);

  // 9. Inicia o servidor escutando em todas as interfaces de rede (0.0.0.0)
  server.listen(ENV.PORT, ENV.HOST, () => {
    printServerBanner(ENV.PORT, 3000);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Erro fatal ao iniciar o LocalSocial Server:', err);
  process.exit(1);
});
