const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const database = require("./database");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : process.env.RENDER
    ? path.join('/tmp', 'uploads')
    : path.join(rootDir, "uploads");
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(rootDir, "data");
const dbPath = path.join(dataDir, "db.json");

// Ensure needed directories exist
for (const dir of [publicDir, uploadsDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isAllowedEmailDomain(email) {
  const normalized = normalizeEmail(email);
  // Solo aceptar correos que terminen exactamente en @cusco.coar.edu.pe
  // Y también el administrador cruel@admin
  const allowed = normalized.endsWith("@cusco.coar.edu.pe") || normalized === "cruel@admin";
  console.log(`🔍 Email validation: ${email} -> ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
  return allowed;
}

function isOwner(userId, ownerId) {
  return userId && ownerId && String(userId) === String(ownerId);
}

function censorInviteCode(code) {
  if (!code || code.length < 2) return code;
  return '**' + code.substring(2);
}

function isAdmin(user) {
  return user && user.email === "cruel@admin";
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: "Acceso denegado. Se requieren privilegios de administrador." });
  }
  next();
}

const FILE_RETENTION_DAYS = process.env.FILE_RETENTION_DAYS
  ? Number(process.env.FILE_RETENTION_DAYS)
  : 3;
const NEWS_RETENTION_DAYS = process.env.NEWS_RETENTION_DAYS
  ? Number(process.env.NEWS_RETENTION_DAYS)
  : 3;
const FILE_RETENTION_MS = Number.isFinite(FILE_RETENTION_DAYS) ? FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000 : 0;
const NEWS_RETENTION_MS = Number.isFinite(NEWS_RETENTION_DAYS) ? NEWS_RETENTION_DAYS * 24 * 60 * 60 * 1000 : 0;

async function cleanupOldUploads() {
  if (!FILE_RETENTION_MS || FILE_RETENTION_MS <= 0) return;
  const cutoff = new Date(Date.now() - FILE_RETENTION_MS).toISOString();

  try {
    const deleted = await database.deleteOldAttachments(cutoff);
    console.log(`Cleaned up ${deleted.changes} old attachments`);
  } catch (err) {
    console.error('Error cleaning up old uploads:', err);
  }
}

async function cleanupOldNews() {
  if (!NEWS_RETENTION_MS || NEWS_RETENTION_MS <= 0) return;
  const cutoff = new Date(Date.now() - NEWS_RETENTION_MS).toISOString();

  try {
    // Get old news with their attachments
    const allNews = await database.getAllNews();
    const oldNews = allNews.filter(n => new Date(n.createdAt) < new Date(cutoff));
    
    let deletedNews = 0;
    let deletedFiles = 0;

    for (const news of oldNews) {
      // Delete attachments first
      const attachments = await database.getAttachmentsByNewsId(news.id);
      for (const att of attachments) {
        const filePath = path.join(uploadsDir, att.storedName);
        try {
          await fsp.unlink(filePath);
          deletedFiles++;
        } catch (err) {
          // ignore if file already deleted
        }
      }
      
      // Delete attachments from database
      await database.deleteAttachmentsByNewsId(news.id);
      
      // Delete news from database
      await database.deleteNews(news.id);
      deletedNews++;
    }

    if (deletedNews > 0) {
      console.log(`Cleaned up ${deletedNews} old news and ${deletedFiles} files`);
    }
  } catch (err) {
    console.error('Error cleaning up old news:', err);
  }
}

async function getUserByEmail(email) {
  const e = normalizeEmail(email);
  return await database.getUserByEmail(e);
}

async function getUserById(id) {
  return await database.getUserById(id);
}

function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    getUserById(payload.sub).then(user => {
      if (!user) return res.status(401).json({ error: "No autorizado" });
      req.user = user;
      return next();
    }).catch(() => {
      return res.status(401).json({ error: "No autorizado" });
    });
  } catch (err) {
    return res.status(401).json({ error: "No autorizado" });
  }
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

app.use(cors());
app.use(express.json());

// Log todas las solicitudes para debugging
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

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
  console.log(`📝 Signup attempt: ${req.body?.email}`);
  try {
    const { email, password, displayName, inviteCode } = req.body || {};

    if (!email || !password || !displayName || !inviteCode) {
      return res.status(400).json({
        error: "Faltan datos (email, contraseña, nombre y código personal).",
      });
    }

    console.log(`🔍 Validating email: ${email}`);
    if (!isAllowedEmailDomain(email)) {
      console.log(`❌ Email blocked: ${email}`);
      return res.status(403).json({ error: "Correo no autorizado." });
    }

    console.log(`✅ Email allowed: ${email}`);
    const normalizedInviteCode = String(inviteCode).trim();
    if (!normalizedInviteCode) {
      return res.status(400).json({ error: "El código personal no puede estar vacío." });
    }

    const normalizedEmail = normalizeEmail(email);
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: "Este correo ya está registrado." });
    }

    const allUsers = await database.getAllUsers();
    if (allUsers.some((u) => u.inviteCode === normalizedInviteCode)) {
      return res.status(409).json({ error: "Este código personal ya está en uso." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      inviteCode: normalizedInviteCode,
      passwordHash,
      displayName: String(displayName).trim(),
      createdAt: new Date().toISOString(),
    };

    await database.createUser(user);
    console.log(`👤 User created: ${email}`);

    return res.status(201).json({
      message: "Cuenta creada correctamente",
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    console.error('❌ Signup error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  console.log(`🔐 Login attempt: ${req.body?.email}`);
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Faltan datos." });

    console.log(`🔍 Validating login email: ${email}`);
    if (!isAllowedEmailDomain(email)) {
      console.log(`❌ Login email blocked: ${email}`);
      return res.status(403).json({ error: "Correo no autorizado." });
    }

    console.log(`✅ Login email allowed: ${email}`);
    const user = await getUserByEmail(email);
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = signToken(user);
    console.log(`🎉 Login successful: ${email}`);
    return res.json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const u = req.user;
  return res.json({ user: { id: u.id, email: u.email, displayName: u.displayName } });
});

app.get("/api/news", async (req, res) => {
  try {
    // Public feed: listado de noticias con nombre del autor, código censurado y adjuntos
    const newsSorted = await database.getAllNews();

    const out = [];
    for (const n of newsSorted) {
      const author = await getUserById(n.authorId);
      const atts = await database.getAttachmentsByNewsId(n.id);
      out.push({
        id: n.id,
        title: n.title,
        content: n.content,
        authorId: n.authorId,
        authorName: author ? author.displayName : "Desconocido",
        authorCode: author ? censorInviteCode(author.inviteCode) : null,
        createdAt: n.createdAt,
        attachments: atts.map((a) => ({
          id: a.id,
          originalName: a.originalName,
          storedName: a.storedName,
          mime: a.mime,
          size: a.size,
        })),
      });
    }

    return res.json({ news: out });
  } catch (err) {
    console.error('Get news error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
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

      // Validar tamaño de archivos
      const files = Array.isArray(req.files) ? req.files : [];
      const maxSize = 20 * 1024 * 1024; // 20MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      for (const f of files) {
        if (f.size > maxSize) {
          return res.status(400).json({ 
            error: `El archivo ${f.originalname} excede el tamaño máximo de 20MB.` 
          });
        }
        if (!allowedTypes.includes(f.mimetype)) {
          return res.status(400).json({ 
            error: `El archivo ${f.originalname} tiene un tipo no permitido.` 
          });
        }
      }

      const news = {
        id: crypto.randomUUID(),
        title: String(title).trim(),
        content: String(content).trim(),
        authorId: req.user.id,
        createdAt: new Date().toISOString(),
      };

      await database.createNews(news);

      // Procesar archivos
      const uploadedFiles = [];
      for (const f of files) {
        await database.createAttachment({
          id: crypto.randomUUID(),
          newsId: news.id,
          originalName: f.originalname,
          storedName: f.filename,
          mime: f.mimetype,
          size: f.size,
          createdAt: new Date().toISOString(),
        });

        uploadedFiles.push({
          id: null,
          originalName: f.originalname,
          storedName: f.filename,
          mime: f.mimetype,
          size: f.size,
        });
      }

      const result = {
        id: news.id,
        title: news.title,
        content: news.content,
        authorId: news.authorId,
        authorName: req.user.displayName,
        authorCode: censorInviteCode(req.user.inviteCode),
        createdAt: news.createdAt,
        attachments: uploadedFiles,
      };

      return res.status(201).json({ news: result });
    } catch (err) {
      console.error('Create news error:', err);
      
      // Limpiar archivos subidos si hay error
      if (req.files && Array.isArray(req.files)) {
        for (const f of req.files) {
          try {
            await fsp.unlink(path.join(uploadsDir, f.filename));
          } catch (cleanupErr) {
            // ignore cleanup errors
          }
        }
      }
      
      return res.status(500).json({ error: "Error interno al crear la noticia" });
    }
  }
);

app.delete("/api/news/:newsId", requireAuth, async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await database.getNewsById(newsId);
    if (!news) return res.status(404).json({ error: "Noticia no encontrada." });
    if (!isOwner(req.user.id, news.authorId)) return res.status(403).json({ error: "No autorizado." });

    // Delete attachments belonging to this news
    const atts = await database.getAttachmentsByNewsId(newsId);
    for (const att of atts) {
      const filePath = path.join(uploadsDir, att.storedName);
      try {
        await fsp.unlink(filePath);
      } catch (err) {
        // ignore
      }
    }
    await database.deleteAttachmentsByNewsId(newsId);

    await database.deleteNews(newsId);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete news error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Forum (hilos y respuestas)
app.get("/api/forum/threads", requireAuth, async (req, res) => {
  try {
    const threadsSorted = await database.getAllThreads();
    const allReplies = await database.all('SELECT threadId, COUNT(*) as count FROM forumReplies GROUP BY threadId');
    
    const replyCountByThreadId = new Map();
    for (const r of allReplies) {
      replyCountByThreadId.set(r.threadId, r.count);
    }

    const out = [];
    for (const t of threadsSorted) {
      const author = await getUserById(t.authorId);
      out.push({
        id: t.id,
        title: t.title,
        body: t.body,
        authorId: t.authorId,
        authorName: author ? author.displayName : "Desconocido",
        authorCode: author ? censorInviteCode(author.inviteCode) : null,
        createdAt: t.createdAt,
        replyCount: replyCountByThreadId.get(t.id) || 0,
      });
    }

    return res.json({ threads: out });
  } catch (err) {
    console.error('Get forum threads error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
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

    await database.createThread(thread);

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
    console.error('Create forum thread error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/forum/threads/:threadId", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await database.getThreadById(threadId);
    if (!thread) return res.status(404).json({ error: "Hilo no encontrado." });

    const author = await getUserById(thread.authorId);
    const replies = await database.getRepliesByThreadId(threadId);
    
    const formattedReplies = [];
    for (const r of replies) {
      const rauthor = await getUserById(r.authorId);
      formattedReplies.push({
        id: r.id,
        body: r.body,
        authorId: r.authorId,
        authorName: rauthor ? rauthor.displayName : "Desconocido",
        createdAt: r.createdAt,
      });
    }

    return res.json({
      thread: {
        id: thread.id,
        title: thread.title,
        body: thread.body,
        authorId: thread.authorId,
        authorName: author ? author.displayName : "Desconocido",
        createdAt: thread.createdAt,
      },
      replies: formattedReplies,
    });
  } catch (err) {
    console.error('Get forum thread error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.delete("/api/forum/threads/:threadId", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await database.getThreadById(threadId);
    if (!thread) return res.status(404).json({ error: "Hilo no encontrado." });
    if (!isOwner(req.user.id, thread.authorId)) return res.status(403).json({ error: "No autorizado." });

    await database.deleteRepliesByThreadId(threadId);
    await database.deleteThread(threadId);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete forum thread error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.delete("/api/forum/replies/:replyId", requireAuth, async (req, res) => {
  try {
    const { replyId } = req.params;
    const reply = await database.get('SELECT * FROM forumReplies WHERE id = ?', [replyId]);
    if (!reply) return res.status(404).json({ error: "Respuesta no encontrada." });
    if (!isOwner(req.user.id, reply.authorId)) return res.status(403).json({ error: "No autorizado." });

    await database.deleteReply(replyId);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete forum reply error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.post("/api/forum/threads/:threadId/replies", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await database.getThreadById(threadId);
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

    await database.createReply(reply);

    return res.status(201).json({
      reply: {
        id: reply.id,
        body: reply.body,
        authorName: req.user.displayName,
        createdAt: reply.createdAt,
      },
    });
  } catch (err) {
    console.error('Create forum reply error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// === ENDPOINTS ADMINISTRATIVOS ===

// Obtener todos los usuarios (solo admin)
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await database.getAllUsers();
    const usersWithStats = [];
    
    for (const user of users) {
      const newsCount = await database.get('SELECT COUNT(*) as count FROM news WHERE authorId = ?', [user.id]);
      const threadsCount = await database.get('SELECT COUNT(*) as count FROM forumThreads WHERE authorId = ?', [user.id]);
      const repliesCount = await database.get('SELECT COUNT(*) as count FROM forumReplies WHERE authorId = ?', [user.id]);
      
      usersWithStats.push({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        inviteCode: user.inviteCode,
        createdAt: user.createdAt,
        isAdmin: isAdmin(user),
        stats: {
          newsCount: newsCount.count || 0,
          threadsCount: threadsCount.count || 0,
          repliesCount: repliesCount.count || 0
        }
      });
    }
    
    return res.json({ users: usersWithStats });
  } catch (err) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Eliminar usuario (solo admin)
app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // No permitir eliminar al admin actual
    if (userId === req.user.id) {
      return res.status(400).json({ error: "No puedes eliminar tu propia cuenta de administrador." });
    }
    
    const user = await database.getUserById(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    
    // Eliminar todas las noticias del usuario
    const userNews = await database.all('SELECT * FROM news WHERE authorId = ?', [userId]);
    for (const news of userNews) {
      // Eliminar archivos adjuntos
      const attachments = await database.getAttachmentsByNewsId(news.id);
      for (const att of attachments) {
        const filePath = path.join(uploadsDir, att.storedName);
        try {
          await fsp.unlink(filePath);
        } catch (err) {
          // ignore
        }
      }
      await database.deleteAttachmentsByNewsId(news.id);
      await database.deleteNews(news.id);
    }
    
    // Eliminar todos los hilos y respuestas del usuario
    const userThreads = await database.all('SELECT * FROM forumThreads WHERE authorId = ?', [userId]);
    for (const thread of userThreads) {
      await database.deleteRepliesByThreadId(thread.id);
      await database.deleteThread(thread.id);
    }
    
    const userReplies = await database.all('SELECT * FROM forumReplies WHERE authorId = ?', [userId]);
    for (const reply of userReplies) {
      await database.deleteReply(reply.id);
    }
    
    // Eliminar usuario
    await database.deleteUser(userId);
    
    return res.json({ 
      message: "Usuario y todos sus contenidos eliminados correctamente",
      deletedUser: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Obtener todas las noticias (solo admin)
app.get("/api/admin/news", requireAdmin, async (req, res) => {
  try {
    const news = await database.getAllNews();
    const newsWithDetails = [];
    
    for (const n of news) {
      const author = await getUserById(n.authorId);
      const atts = await database.getAttachmentsByNewsId(n.id);
      
      newsWithDetails.push({
        id: n.id,
        title: n.title,
        content: n.content,
        authorId: n.authorId,
        authorName: author ? author.displayName : "Desconocido",
        authorEmail: author ? author.email : null,
        authorCode: author ? author.inviteCode : null,
        createdAt: n.createdAt,
        attachments: atts.map((a) => ({
          id: a.id,
          originalName: a.originalName,
          storedName: a.storedName,
          mime: a.mime,
          size: a.size,
        })),
      });
    }
    
    return res.json({ news: newsWithDetails });
  } catch (err) {
    console.error('Admin get news error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Eliminar noticia (solo admin)
app.delete("/api/admin/news/:newsId", requireAdmin, async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await database.getNewsById(newsId);
    if (!news) return res.status(404).json({ error: "Noticia no encontrada." });

    // Delete attachments belonging to this news
    const atts = await database.getAttachmentsByNewsId(newsId);
    for (const att of atts) {
      const filePath = path.join(uploadsDir, att.storedName);
      try {
        await fsp.unlink(filePath);
      } catch (err) {
        // ignore
      }
    }
    await database.deleteAttachmentsByNewsId(newsId);

    await database.deleteNews(newsId);
    return res.json({ 
      message: "Noticia eliminada correctamente",
      deletedNews: {
        id: news.id,
        title: news.title,
        authorId: news.authorId
      }
    });
  } catch (err) {
    console.error('Admin delete news error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Obtener todos los hilos (solo admin)
app.get("/api/admin/threads", requireAdmin, async (req, res) => {
  try {
    const threads = await database.getAllThreads();
    const threadsWithDetails = [];
    
    for (const t of threads) {
      const author = await getUserById(t.authorId);
      const replies = await database.getRepliesByThreadId(t.id);
      
      threadsWithDetails.push({
        id: t.id,
        title: t.title,
        body: t.body,
        authorId: t.authorId,
        authorName: author ? author.displayName : "Desconocido",
        authorEmail: author ? author.email : null,
        authorCode: author ? author.inviteCode : null,
        createdAt: t.createdAt,
        replyCount: replies.length,
        replies: replies.map(r => ({
          id: r.id,
          body: r.body,
          authorId: r.authorId,
          createdAt: r.createdAt
        }))
      });
    }
    
    return res.json({ threads: threadsWithDetails });
  } catch (err) {
    console.error('Admin get threads error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Eliminar hilo (solo admin)
app.delete("/api/admin/threads/:threadId", requireAdmin, async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await database.getThreadById(threadId);
    if (!thread) return res.status(404).json({ error: "Hilo no encontrado." });

    await database.deleteRepliesByThreadId(threadId);
    await database.deleteThread(threadId);
    
    return res.json({ 
      message: "Hilo y todas sus respuestas eliminados correctamente",
      deletedThread: {
        id: thread.id,
        title: thread.title,
        authorId: thread.authorId
      }
    });
  } catch (err) {
    console.error('Admin delete thread error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Obtener estadísticas del sistema (solo admin)
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const totalUsers = await database.get('SELECT COUNT(*) as count FROM users');
    const totalNews = await database.get('SELECT COUNT(*) as count FROM news');
    const totalThreads = await database.get('SELECT COUNT(*) as count FROM forumThreads');
    const totalReplies = await database.get('SELECT COUNT(*) as count FROM forumReplies');
    const totalAttachments = await database.get('SELECT COUNT(*) as count FROM attachments');
    
    const users = await database.getAllUsers();
    const adminUsers = users.filter(isAdmin);
    
    return res.json({
      stats: {
        totalUsers: totalUsers.count || 0,
        adminUsers: adminUsers.length,
        regularUsers: (totalUsers.count || 0) - adminUsers.length,
        totalNews: totalNews.count || 0,
        totalThreads: totalThreads.count || 0,
        totalReplies: totalReplies.count || 0,
        totalAttachments: totalAttachments.count || 0
      }
    });
  } catch (err) {
    console.error('Admin get stats error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Cambiar contraseña de usuario (solo admin)
app.post("/api/admin/users/:userId/reset-password", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body || {};
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
    }
    
    const user = await database.getUserById(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await database.updateUserPassword(userId, passwordHash);
    
    return res.json({ 
      message: "Contraseña actualizada correctamente",
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (err) {
    console.error('Admin reset password error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Frontend static files con configuración mejorada
app.use(express.static(publicDir, {
  maxAge: '1h', // Cache de 1 hora
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Configurar headers para diferentes tipos de archivos
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Middleware para verificar archivos estáticos
app.use((req, res, next) => {
  // Si es una ruta de archivo, verificar que exista
  if (req.path.includes('.') && !req.path.startsWith('/api/')) {
    const filePath = path.join(publicDir, req.path);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Static file not found: ${req.path}`);
      return res.status(404).send('File not found');
    }
  }
  next();
});

// Rutas específicas de HTML con logs
app.get("/", (req, res) => {
  console.log(`🏠 Serving login.html as homepage`);
  res.sendFile(path.join(publicDir, "login.html"));
});

app.get("/login.html", (req, res) => {
  console.log(`🔐 Serving login.html`);
  res.sendFile(path.join(publicDir, "login.html"));
});

app.get("/signup.html", (req, res) => {
  console.log(`📝 Serving signup.html`);
  res.sendFile(path.join(publicDir, "signup.html"));
});

app.get("/index.html", (req, res) => {
  console.log(`🏠 Serving index.html`);
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/admin.html", (req, res) => {
  console.log(`⚙️ Serving admin.html`);
  res.sendFile(path.join(publicDir, "admin.html"));
});

// Helpful SPA-ish fallback: solo para rutas que no son API y no son archivos HTML específicos
app.get("*", (req, res) => {
  // Si es una ruta de API, no servir HTML
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  // Si es una ruta de archivo estático, no servir HTML
  if (req.path.includes(".")) {
    return res.status(404).send("File not found");
  }
  
  // Para cualquier otra ruta, servir index.html (para usuarios autenticados)
  res.sendFile(path.join(publicDir, "index.html"));
});

database.connect()
  .then(async () => {
    // Asegurar que el administrador exista
    await ensureAdminExists();
    
    // Cleanup uploads and news (best effort) on startup and periodically
    cleanupOldUploads().catch(() => {});
    cleanupOldNews().catch(() => {});
    
    setInterval(() => {
      cleanupOldUploads().catch(() => {});
      cleanupOldNews().catch(() => {});
    }, 6 * 60 * 60 * 1000); // cada 6 horas

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🌙 El Rincón del Mentiroso - Servidor iniciado`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📁 Retención archivos: ${FILE_RETENTION_DAYS} días`);
      console.log(`📰 Retención noticias: ${NEWS_RETENTION_DAYS} días`);
      console.log(`✅ Dominio permitido: @cusco.coar.edu.pe`);
      console.log(`👑 Admin: cruel@admin`);
      console.log(`🚀 Deployment: ${new Date().toISOString()}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Error al iniciar:", err);
    process.exit(1);
  });

// Función para asegurar que el admin exista
async function ensureAdminExists() {
  try {
    const existingAdmin = await getUserByEmail("cruel@admin");
    
    if (!existingAdmin) {
      console.log("Creando usuario administrador por defecto...");
      const passwordHash = await bcrypt.hash("123456789", 10);
      
      const adminUser = {
        id: crypto.randomUUID(),
        email: "cruel@admin",
        inviteCode: "ADMIN001",
        passwordHash,
        displayName: "Administrador",
        createdAt: new Date().toISOString(),
      };

      await database.createUser(adminUser);
      console.log("✅ Usuario administrador creado: cruel@admin / 123456789");
    } else {
      console.log("✅ Usuario administrador ya existe: cruel@admin");
    }
  } catch (err) {
    console.error("Error al crear usuario administrador:", err);
  }
}

