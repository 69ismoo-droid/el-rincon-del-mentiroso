import type { RequestHandler } from "express";

/**
 * Exige sesión válida para todo /api salvo health y /api/auth/*.
 * Refuerzo además de requireAuth en cada ruta.
 */
export const requireApiSession: RequestHandler = (req, res, next) => {
  const path = req.originalUrl.split("?")[0] ?? "";
  if (path === "/api/health" || path.startsWith("/api/auth")) {
    next();
    return;
  }
  if (!path.startsWith("/api")) {
    next();
    return;
  }
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  next();
};
