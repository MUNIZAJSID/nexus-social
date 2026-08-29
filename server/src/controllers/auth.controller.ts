import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { ENV } from '../config/env';
import { AuthRequest } from '../middlewares/auth.middleware';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.')
    .max(30, 'O nome de usuário pode ter no máximo 30 caracteres.')
    .regex(/^[a-zA-Z0-9._]+$/, 'Nome de usuário pode conter apenas letras, números, pontos e underlines.')
    .transform((val) => val.toLowerCase()),
  displayName: z.string().min(2, 'O nome de exibição deve ter pelo menos 2 caracteres.').max(50),
  email: z.string().email('Email inválido.').transform((val) => val.toLowerCase()),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Informe seu usuário ou email.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  // Verifica se username ou email já estão cadastrados
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }],
    },
  });

  if (existingUser) {
    if (existingUser.username === data.username) {
      return res.status(400).json({ success: false, message: 'Este nome de usuário já está em uso.' });
    }
    return res.status(400).json({ success: false, message: 'Este email já está cadastrado.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  // Primeiro usuário registrado ou nome admin vira ADMIN automaticamente
  const userCount = await prisma.user.count();
  const role = userCount === 0 || data.username === ENV.ADMIN_USERNAME.toLowerCase() ? 'ADMIN' : 'USER';

  const user = await prisma.user.create({
    data: {
      username: data.username,
      displayName: data.displayName,
      email: data.email,
      passwordHash,
      role,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      bio: true,
      isPrivate: true,
      role: true,
      createdAt: true,
    },
  });

  const token = jwt.sign({ id: user.id }, ENV.JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    success: true,
    message: 'Conta criada com sucesso!',
    token,
    user,
  });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const identifier = data.identifier.toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
  }

  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: 'Sua conta foi suspensa por um administrador.',
    });
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
  }

  const token = jwt.sign({ id: user.id }, ENV.JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    success: true,
    message: 'Login realizado com sucesso!',
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isPrivate: user.isPrivate,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}

export async function getMe(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Não autenticado.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      bio: true,
      isPrivate: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  return res.json({
    success: true,
    user: {
      ...user,
      counts: user._count,
    },
  });
}

export async function updatePassword(req: AuthRequest, res: Response) {
  const schema = z.object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
  });

  const { currentPassword, newPassword } = schema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Senha atual incorreta.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return res.json({ success: true, message: 'Senha alterada com sucesso!' });
}
