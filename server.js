const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const SIGNUP_CODES_RAW = process.env.SIGNUP_CODES || process.env.SIGNUP_CODE || "00-2027";
const SIGNUP_CODES = String(SIGNUP_CODES_RAW)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(rootDir, "uploads");
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(rootDir, "data");
const dbPath = path.join(dataDir, "db.json");

// Ensure needed directories exist
for (const dir of [publicDir, uploadsDir, dataDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Simple JSON "DB" stored on disk
let db = { users: [], news: [], attachments: [], forumThreads: [], forumReplies: [] };
let writeQueue = Promise.resolve();

async function loadDb() {
  try {
    const raw = await fsp.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") db = parsed;
  } catch (err) {
    // If it doesn't exist yet, keep the default empty db
  }

  // Ensure keys exist (compatible with older db.json)
  db.users = Array.isArray(db.users) ? db.users : [];
  db.news = Array.isArray(db.news) ? db.news : [];
  db.attachments = Array.isArray(db.attachments) ? db.attachments : [];
  db.forumThreads = Array.isArray(db.forumThreads) ? db.forumThreads : [];
  db.forumReplies = Array.isArray(db.forumReplies) ? db.forumReplies : [];
}

function persistDb() {
  // Serialize writes to avoid clobbering the JSON file
  writeQueue = writeQueue.then(async () => {
    await fsp.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
  });
  return writeQueue;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isAllowedEmailDomain(email) {
  const normalized = normalizeEmail(email);
  return normalized.endsWith("@cusco.coar.edu.pe");
}

function isOwner(userId, ownerId) {
  return userId && ownerId && String(userId) === String(ownerId);
}

const FILE_RETENTION_DAYS = process.env.FILE_RETENTION_DAYS
  ? Number(process.env.FILE_RETENTION_DAYS)
  : 3;
const FILE_RETENTION_MS = Number.isFinite(FILE_RETENTION_DAYS) ? FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000 : 0;

async function cleanupOldUploads() {
  if (!FILE_RETENTION_MS || FILE_RETENTION_MS <= 0) return;
  const cutoff = Date.now() - FILE_RETENTION_MS;

  const toDelete = [];
  const keep = [];

  for (const att of db.attachments) {
    const createdAtMs = Date.parse(att.createdAt || "");
    if (Number.isFinite(createdAtMs) && createdAtMs < cutoff) {
      toDelete.push(att);
    } else {
      keep.push(att);
    }
  }

  if (toDelete.length === 0) return;

  for (const att of toDelete) {
    const filePath = path.join(uploadsDir, att.storedName);
    try {
      await fsp.unlink(filePath);
    } catch (err) {
      // ignore (already deleted / missing)
    }
  }

  db.attachments = keep;
  await persistDb();
}

function getUserByEmail(email) {
  const e = normalizeEmail(email);
  return db.users.find((u) => u.email === e) || null;
}

function getUserById(id) {
  return db.users.find((u) => u.id === id) || null;
}

function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "No autorizado" });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "No autorizado" });
  }
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Upload settings for news attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, displayName, inviteCode } = req.body || {};

    if (!email || !password || !displayName || !inviteCode) {
      return res.status(400).json({
        error: "Faltan datos (email, contraseña, nombre y código de acceso).",
      });
    }

    if (!isAllowedEmailDomain(email)) {
      return res.status(403).json({ error: "Correo no autorizado." });
    }

    const normalizedInviteCode = String(inviteCode).trim();
    if (!SIGNUP_CODES.includes(normalizedInviteCode)) {
      return res.status(403).json({ error: "Código de acceso inválido." });
    }

    const normalizedEmail = normalizeEmail(email);
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    if (getUserByEmail(normalizedEmail)) {
      return res.status(409).json({ error: "Este correo ya está registrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      displayName: String(displayName).trim(),
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    await persistDb();

    return res.status(201).json({
      message: "Cuenta creada correctamente",
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Faltan datos." });

    if (!isAllowedEmailDomain(email)) {
      return res.status(403).json({ error: "Correo no autorizado." });
    }

    const user = getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const u = req.user;
  return res.json({ user: { id: u.id, email: u.email, displayName: u.displayName } });
});

app.get("/api/news", (req, res) => {
  // Public feed: listado de noticias con nombre del autor y adjuntos
  const newsSorted = [...db.news].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const attachmentsByNewsId = new Map();
  for (const att of db.attachments) {
    const arr = attachmentsByNewsId.get(att.newsId) || [];
    arr.push(att);
    attachmentsByNewsId.set(att.newsId, arr);
  }

  const out = newsSorted.map((n) => {
    const author = getUserById(n.authorId);
    const atts = attachmentsByNewsId.get(n.id) || [];
    return {
      id: n.id,
      title: n.title,
      content: n.content,
      authorId: n.authorId,
      authorName: author ? author.displayName : "Desconocido",
      createdAt: n.createdAt,
      attachments: atts.map((a) => ({
        id: a.id,
        originalName: a.originalName,
        storedName: a.storedName,
        mime: a.mime,
        size: a.size,
      })),
    };
  });

  return res.json({ news: out });
});

app.post(
  "/api/news",
  requireAuth,
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { title, content } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ error: "Faltan campos: title y content." });
      }

      const news = {
        id: crypto.randomUUID(),
        title: String(title).trim(),
        content: String(content).trim(),
        authorId: req.user.id,
        createdAt: new Date().toISOString(),
      };

      db.news.push(news);

      const files = Array.isArray(req.files) ? req.files : [];
      for (const f of files) {
        db.attachments.push({
          id: crypto.randomUUID(),
          newsId: news.id,
          originalName: f.originalname,
          storedName: f.filename,
          mime: f.mimetype,
          size: f.size,
          createdAt: new Date().toISOString(),
        });
      }

      await persistDb();

      const result = {
        id: news.id,
        title: news.title,
        content: news.content,
        authorId: news.authorId,
        authorName: req.user.displayName,
        createdAt: news.createdAt,
        attachments: files.map((f) => ({
          id: null, // The client doesn't need attachment IDs for download
          originalName: f.originalname,
          storedName: f.filename,
          mime: f.mimetype,
          size: f.size,
        })),
      };

      return res.status(201).json({ news: result });
    } catch (err) {
      return res.status(500).json({ error: "Error interno" });
    }
  }
);

app.delete("/api/news/:newsId", requireAuth, async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = db.news.find((n) => n.id === newsId);
    if (!news) return res.status(404).json({ error: "Noticia no encontrada." });
    if (!isOwner(req.user.id, news.authorId)) return res.status(403).json({ error: "No autorizado." });

    // Delete attachments belonging to this news
    const remainingAttachments = [];
    for (const att of db.attachments) {
      if (att.newsId !== newsId) {
        remainingAttachments.push(att);
        continue;
      }
      const filePath = path.join(uploadsDir, att.storedName);
      try {
        await fsp.unlink(filePath);
      } catch (err) {
        // ignore
      }
    }
    db.attachments = remainingAttachments;

    db.news = db.news.filter((n) => n.id !== newsId);
    await persistDb();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
});

// Forum (hilos y respuestas)
app.get("/api/forum/threads", requireAuth, (req, res) => {
  const replyCountByThreadId = new Map();
  for (const r of db.forumReplies) {
    const count = replyCountByThreadId.get(r.threadId) || 0;
    replyCountByThreadId.set(r.threadId, count + 1);
  }

  const threadsSorted = [...db.forumThreads].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const threads = threadsSorted.map((t) => {
    const author = getUserById(t.authorId);
    return {
      id: t.id,
      title: t.title,
      body: t.body,
      authorId: t.authorId,
      authorName: author ? author.displayName : "Desconocido",
      createdAt: t.createdAt,
      replyCount: replyCountByThreadId.get(t.id) || 0,
    };
  });

  return res.json({ threads });
});

app.post("/api/forum/threads", requireAuth, async (req, res) => {
  try {
    const { title, body } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ error: "Faltan campos: title y body." });
    }

    const thread = {
      id: crypto.randomUUID(),
      title: String(title).trim(),
      body: String(body).trim(),
      authorId: req.user.id,
      createdAt: new Date().toISOString(),
    };

    db.forumThreads.push(thread);
    await persistDb();

    return res.status(201).json({
      thread: {
        id: thread.id,
        title: thread.title,
        body: thread.body,
        authorName: req.user.displayName,
        createdAt: thread.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/forum/threads/:threadId", requireAuth, (req, res) => {
  const { threadId } = req.params;
  const thread = db.forumThreads.find((t) => t.id === threadId);
  if (!thread) return res.status(404).json({ error: "Hilo no encontrado." });

  const author = getUserById(thread.authorId);
  const replies = db.forumReplies
    .filter((r) => r.threadId === threadId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((r) => {
      const rauthor = getUserById(r.authorId);
      return {
        id: r.id,
        body: r.body,
        authorId: r.authorId,
        authorName: rauthor ? rauthor.displayName : "Desconocido",
        createdAt: r.createdAt,
      };
    });

  return res.json({
    thread: {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      authorId: thread.authorId,
      authorName: author ? author.displayName : "Desconocido",
      createdAt: thread.createdAt,
    },
    replies,
  });
});

app.delete("/api/forum/threads/:threadId", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = db.forumThreads.find((t) => t.id === threadId);
    if (!thread) return res.status(404).json({ error: "Hilo no encontrado." });
    if (!isOwner(req.user.id, thread.authorId)) return res.status(403).json({ error: "No autorizado." });

    db.forumThreads = db.forumThreads.filter((t) => t.id !== threadId);
    db.forumReplies = db.forumReplies.filter((r) => r.threadId !== threadId);
    await persistDb();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
});

app.delete("/api/forum/replies/:replyId", requireAuth, async (req, res) => {
  try {
    const { replyId } = req.params;
    const reply = db.forumReplies.find((r) => r.id === replyId);
    if (!reply) return res.status(404).json({ error: "Respuesta no encontrada." });
    if (!isOwner(req.user.id, reply.authorId)) return res.status(403).json({ error: "No autorizado." });

    db.forumReplies = db.forumReplies.filter((r) => r.id !== replyId);
    await persistDb();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
});

app.post("/api/forum/threads/:threadId/replies", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = db.forumThreads.find((t) => t.id === threadId);
    if (!thread) return res.status(404).json({ error: "Hilo no encontrado." });

    const { body } = req.body || {};
    if (!body) return res.status(400).json({ error: "Falta el campo: body." });

    const reply = {
      id: crypto.randomUUID(),
      threadId,
      body: String(body).trim(),
      authorId: req.user.id,
      createdAt: new Date().toISOString(),
    };

    db.forumReplies.push(reply);
    await persistDb();

    return res.status(201).json({
      reply: {
        id: reply.id,
        body: reply.body,
        authorName: req.user.displayName,
        createdAt: reply.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
});

// Frontend static files
app.use(express.static(publicDir));

// Helpful SPA-ish fallback: si no existe la ruta, sirve index
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

loadDb()
  .then(() => {
    // Cleanup uploads (best effort) on startup and periodically
    cleanupOldUploads().catch(() => {});
    setInterval(() => {
      cleanupOldUploads().catch(() => {});
    }, 6 * 60 * 60 * 1000); // cada 6 horas

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Error al iniciar:", err);
    process.exit(1);
  });

