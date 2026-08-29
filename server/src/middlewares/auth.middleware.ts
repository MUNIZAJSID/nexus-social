import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../db/prisma';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
  isPrivate: boolean;
  isBlocked: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token de autenticação não fornecido.',
      });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        avatarUrl: true,
        isPrivate: true,
        isBlocked: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou sessão expirada.',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Sua conta foi suspensa temporariamente por um administrador.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado.',
    });
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          role: true,
          avatarUrl: true,
          isPrivate: true,
          isBlocked: true,
        },
      });
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  } catch (e) {
    // Ignora erro de token opcional
  }
  next();
}
