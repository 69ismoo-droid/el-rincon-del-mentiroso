import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { routeAsync } from "./routeAsync.js";

export const requireDb: RequestHandler = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "Base de datos no disponible" });
    return;
  }
  next();
};

export const requireAuth = routeAsync(async (req, res, next) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    console.warn(`[auth] No autorizado: ${req.method} ${req.path}`);
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const user = await User.findById(userId);
  if (!user) {
    console.warn(`[auth] No autorizado (usuario no encontrado): ${req.method} ${req.path}`);
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  req.user = user;
  next();
});

/** Reject banned users. */
export const requireActiveUser: RequestHandler = (req, res, next) => {
  const user = req.user as { banned?: boolean } | undefined;
  if (user?.banned) {
    res.status(403).json({ error: "Cuenta suspendida" });
    return;
  }
  next();
};

export const requireRole = (...roles: string[]): RequestHandler => {
  return (req, res, next) => {
    const user = req.user as { role?: string } | undefined;
    if (!user?.role || !roles.includes(user.role)) {
      res.status(403).json({ error: "No autorizado para esta acción" });
      return;
    }
    next();
  };
};
