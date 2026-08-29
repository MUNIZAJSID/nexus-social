import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Banco de dados local conectado com sucesso (Prisma ORM).');
  } catch (error) {
    console.error('❌ Falha ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}
