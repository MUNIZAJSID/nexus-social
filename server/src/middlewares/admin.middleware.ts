import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária para acessar esta área.',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito apenas a administradores da rede.',
    });
  }

  next();
}
