import { NextFunction, Request, Response } from 'express';

/**
 * Garante que erros lançados em handlers e middlewares assíncronos no Express 4
 * sejam encaminhados automaticamente para o errorHandler global via next(err),
 * evitando crashes por UnhandledPromiseRejection.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Layer = require('express/lib/router/layer');

let patched = false;

export function patchExpressAsync(): void {
  if (patched) return;
  patched = true;

  const originalHandleRequest = Layer.prototype.handle_request;
  Layer.prototype.handle_request = function handleRequest(
    this: { handle: (req: Request, res: Response, next: NextFunction) => unknown },
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const fn = this.handle;
    if (typeof fn !== 'function' || fn.length > 3) {
      return originalHandleRequest.call(this, req, res, next);
    }

    try {
      const result = fn(req, res, next);
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        (result as Promise<unknown>).catch((err: unknown) => next(err));
      }
    } catch (err) {
      next(err);
    }
  };
}

patchExpressAsync();
