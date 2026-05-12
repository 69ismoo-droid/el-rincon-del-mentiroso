import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import passport from "passport";
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
import "./src/server/config/passport.js";

import apiRoutes from "./src/server/routes/api.js";
import authRoutes from "./src/server/routes/auth.js";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV ?? "development";
const isProd = NODE_ENV === "production";

if (isProd) {
  const sec = process.env.SESSION_SECRET;
  if (!sec || sec.length < 32) {
    console.error(
      "SESSION_SECRET debe tener al menos 32 caracteres en producción."
    );
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI es obligatorio en producción.");
    process.exit(1);
  }
}

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
  },
});

const PORT = Number(process.env.PORT) || 3000;
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

app.use((req, res, next) => {
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

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function buildSessionMiddleware(mongoUri: string | undefined) {
  const store =
    mongoUri && mongoUri.length > 0
      ? MongoStore.create({
          mongoUrl: mongoUri,
          ttl: Math.floor(SESSION_MAX_AGE_MS / 1000),
          touchAfter: 12 * 3600,
        })
      : undefined;

  return session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: "coar.sid",
    store,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
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
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB");
    } catch (e) {
      console.error("MongoDB connection error:", e);
      if (isProd) {
        process.exit(1);
      }
    }
  } else if (isProd) {
    process.exit(1);
  }

  const sessionMongoUri =
    mongoUri && mongoose.connection.readyState === 1 ? mongoUri : undefined;
  if (!sessionMongoUri && !isProd) {
    console.warn(
      "Sesiones en memoria (solo desarrollo). Configura MONGODB_URI para persistencia."
    );
  }
  app.use(buildSessionMiddleware(sessionMongoUri));

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/api/health", (req, res) => {
    const db =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({ status: "ok", db });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
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
      console.error(err);
      res.status(500).json({
        error: isProd ? "Error interno del servidor" : (err as Error).message,
      });
    }
  );

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error(e);
  process.exit(1);
});
