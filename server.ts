import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import {
  getPublicUrl,
  isProductionEnv,
  shouldUseSecureSessionCookies,
} from "./src/server/config/env.js";
import { validateEnvOrExit } from "./src/server/config/validateEnv.js";
import { logger } from "./src/server/lib/logger.js";
import { HttpError } from "./src/server/lib/httpError.js";

import apiRoutes from "./src/server/routes/api.js";
import authRoutes from "./src/server/routes/auth.js";
import verificationRoutes from "./src/server/routes/verification.js";
import uploadRoutes from "./src/server/routes/upload.js";
import { mailService } from "./src/server/mail/mailService.js";

dotenv.config();
validateEnvOrExit();

const NODE_ENV = process.env.NODE_ENV ?? "development";
const isProd = isProductionEnv();

function parseCorsOrigin(): boolean | string | string[] {
  const raw = process.env.CORS_ORIGINS ?? process.env.CLIENT_ORIGIN;
  if (!raw) return true;
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return true;
  if (list.length === 1) return list[0]!;
  return list;
}

const app = express();
app.set("trust proxy", 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: parseCorsOrigin(),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = Number(process.env.PORT) || 3002;
const userSockets = new Map<string, string>();

io.on("connection", (socket) => {
  socket.on("register", (userId: unknown) => {
    if (typeof userId !== "string" || !mongoose.isValidObjectId(userId)) {
      return;
    }
    userSockets.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

app.use((req: any, res, next) => {
  req.io = io;
  req.userSockets = userSockets;
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: parseCorsOrigin(),
    credentials: true,
  })
);

const sessionSecret =
  process.env.SESSION_SECRET ?? "solo-desarrollo-no-usar-en-produccion";

const SESSION_MAX_AGE_MS =
  Math.max(1, Number(process.env.SESSION_MAX_AGE_DAYS) || 7) *
  24 *
  60 *
  60 *
  1000;

function parseSameSite(): "lax" | "strict" | "none" {
  const s = (process.env.SESSION_SAME_SITE ?? "lax").toLowerCase();
  if (s === "strict" || s === "none") return s;
  return "lax";
}

function shouldUseSecureCookies(sameSite: "lax" | "strict" | "none"): boolean {
  return shouldUseSecureSessionCookies(sameSite);
}

function buildSessionMiddleware(mongoUri: string | undefined) {
  const store =
    mongoUri && mongoUri.length > 0
      ? MongoStore.create({
          mongoUrl: mongoUri,
          ttl: Math.floor(SESSION_MAX_AGE_MS / 1000),
          touchAfter: 12 * 3600,
        })
      : undefined;

  const sameSite = parseSameSite();
  const cookieSecure = shouldUseSecureCookies(sameSite);

  const cookieName = process.env.SESSION_COOKIE_NAME?.trim() || "coar.sid";
  const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

  return session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: cookieName,
    store,
    cookie: {
      secure: cookieSecure,
      httpOnly: true,
      sameSite,
      maxAge: SESSION_MAX_AGE_MS,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    },
  });
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 400 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === "/health" || req.originalUrl.startsWith("/api/health"),
  handler: (req, res) => {
    res.status(429).json({ error: "Demasiadas peticiones. Espera un momento." });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 40 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: "Demasiados intentos de acceso. Espera e inténtalo de nuevo." });
  },
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      // Forzar explícitamente el uso de la base de datos 'coar'
      const options = {
        dbName: 'coar',
      };
      await mongoose.connect(mongoUri, options);
      logger.info("Connected to MongoDB (coar)");
    } catch (e) {
      logger.error("MongoDB connection error", { err: String(e) });
      if (isProd) {
        process.exit(1);
      }
    }
  } else if (isProd) {
    logger.error("MONGODB_URI ausente en producción");
    process.exit(1);
  }

  const sessionMongoUri =
    mongoUri && mongoose.connection.readyState === 1 ? mongoUri : undefined;
  if (!sessionMongoUri && !isProd) {
    logger.warn(
      "Sesiones en memoria (solo desarrollo). Configura MONGODB_URI para persistencia."
    );
  }
  const sessionMiddleware = buildSessionMiddleware(sessionMongoUri);
  app.use(sessionMiddleware);
  if (!shouldUseSecureCookies(parseSameSite()) && isProd) {
    logger.warn(
      "Cookies de sesión sin Secure. Configura PUBLIC_URL con https:// o despliega en Render con HTTPS."
    );
  }

  if (isProd) {
    const publicUrl = getPublicUrl();
    if (publicUrl) {
      logger.info("Public URL", { url: publicUrl });
    }
  }

  app.get("/api/health", (req, res) => {
    const db =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({
      status: db === "connected" ? "ok" : "degraded",
      db,
      mail: mailService.isConfigured() ? "configured" : "missing",
      env: isProd ? "production" : "development",
    });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/auth", verificationRoutes);
  app.use("/api", uploadRoutes);
  app.use("/api", apiRoutes);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err instanceof HttpError) {
        logger.warn("HttpError", { status: err.status, message: err.message });
        res.status(err.status).json({
          error: err.message,
          ...(err.details ?? {}),
        });
        return;
      }
      const e = err as Error & { name?: string; code?: number };
      logger.error("Unhandled error", {
        message: e.message,
        stack: e.stack,
        name: e.name,
      });
      if (e.name === "CastError") {
        res.status(400).json({ error: "Identificador inválido" });
        return;
      }
      if (e.code === 11000) {
        res.status(409).json({ error: "Conflicto: el recurso ya existe" });
        return;
      }
      res.status(500).json({
        error: isProd ? "Error interno del servidor" : e.message,
      });
    }
  );

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", { reason: String(reason) });
});
process.on("uncaughtException", (err) => {
  logger.error("uncaughtException", { err: err.message, stack: err.stack });
  process.exit(1);
});

startServer().catch((e) => {
  logger.error("startServer failed", { err: String(e) });
  process.exit(1);
});
