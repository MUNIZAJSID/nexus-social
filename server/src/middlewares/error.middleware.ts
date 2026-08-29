import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('⚠️ [ErrorHandler]:', err);

  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos.',
      errors: errorMessages,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. O tamanho máximo permitido foi excedido.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erro no upload de arquivo: ${err.message}`,
    });
  }

  if (err.message && err.message.includes('Tipo de arquivo não suportado')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ocorreu um erro interno no servidor.';

  return res.status(statusCode).json({
    success: false,
    message,
  });
}
