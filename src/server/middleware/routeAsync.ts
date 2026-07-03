import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Propaga errores de handlers async al middleware de errores de Express. */
export function routeAsync(
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void | Response>
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
