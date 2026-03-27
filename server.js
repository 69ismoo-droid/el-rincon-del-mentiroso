const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Configuración
dotenv.config();

// Forzar MONGODB_URI si Render no la encuentra
if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  process.env.MONGODB_URI = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/?appName=Cluster0';
  console.log('🔧 Forzando MONGODB_URI en producción');
}

// Debug variables de entorno
console.log('🔍 Variables de entorno:');
console.log('📍 MONGODB_URI:', process.env.MONGODB_URI ? 'DEFINIDA' : 'NO DEFINIDA');
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? 'DEFINIDA' : 'NO DEFINIDA');
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
console.log('🚪 PORT:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(rootDir, "uploads");

// Ensure needed directories exist
for (const dir of [publicDir, uploadsDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isAllowedEmailDomain(email) {
  const normalized = normalizeEmail(email);
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

// Frontend static files con configuración mejorada
app.use(express.static(publicDir, {
  maxAge: '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

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

// Importar base de datos MongoDB
const database = require('./database-mongo');
const { User, News, Attachment, Thread, Reply } = require('./models');

// Middleware de autenticación
function requireAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "No autorizado" });
  }
}

// Helper functions
async function getUserByEmail(email) {
  return await database.getUserByEmail(email);
}

async function getUserById(id) {
  return await database.getUserById(id);
}

// Rutas de Autenticación
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
      user: { email: user.email, displayName: user.displayName },
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
      console.log(`❌ User not found in database: ${email}`);
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    console.log(`👤 User found:`, { 
      id: user._id, 
      email: user.email, 
      displayName: user.displayName,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash?.length || 0
    });

    // Intentar login con bcrypt.compare normal
    let ok = await bcrypt.compare(password, user.passwordHash);
    console.log(`🔑 Password comparison result: ${ok}`);
    
    // Si falla, intentar con doble hash (usuarios antiguos)
    if (!ok) {
      console.log(`🔄 Intentando con doble hash (usuario antiguo)`);
      const doubleHash = await bcrypt.hash(password, 10);
      ok = await bcrypt.compare(doubleHash, user.passwordHash);
      console.log(`🔑 Double hash comparison result: ${ok}`);
      
      if (ok) {
        console.log(`✅ Usuario antiguo detectado, actualizando contraseña...`);
        // Actualizar a hash simple para futuros logins
        const newHash = await bcrypt.hash(password, 10);
        await database.updateUserPassword(user.id, newHash);
        console.log(`🔄 Contraseña actualizada a formato simple`);
      }
    }
    
    if (!ok) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = signToken({ id: user.id, email: user.email });
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
  return res.json({ user: { id: req.user.id, email: req.user.email } });
});

// Rutas de Noticias
app.get("/api/news", async (req, res) => {
  try {
    const news = await database.getAllNews();
    const newsWithAuthors = await Promise.all(
      news.map(async (n) => {
        const author = await getUserById(n.authorId);
        return {
          ...n.toObject(),
          authorName: author ? author.displayName : "Usuario eliminado",
          attachments: await database.getAttachmentsByNewsId(n.id),
        };
      })
    );
    return res.json({ news: newsWithAuthors });
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

      const news = {
        title: String(title).trim(),
        content: String(content).trim(),
        authorId: req.user.id,
        createdAt: new Date().toISOString(),
      };

      const createdNews = await database.createNews(news);

      const files = Array.isArray(req.files) ? req.files : [];
      for (const f of files) {
        await database.createAttachment({
          newsId: createdNews._id,
          originalName: f.originalname,
          storedName: f.filename,
          mime: f.mimetype,
          size: f.size,
          createdAt: new Date().toISOString(),
        });
      }

      const result = {
        id: createdNews._id,
        title: news.title,
        content: news.content,
        authorId: news.authorId,
        createdAt: news.createdAt,
        attachments: files.map((f) => ({
          originalName: f.originalname,
          storedName: f.filename,
          mime: f.mimetype,
          size: f.size,
        })),
      };

      return res.status(201).json({ news: result });
    } catch (err) {
      console.error('Create news error:', err);
      return res.status(500).json({ error: "Error interno" });
    }
  }
);

app.delete("/api/news/:newsId", requireAuth, async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await database.getNewsById(newsId);
    if (!news) {
      return res.status(404).json({ error: "Noticia no encontrada." });
    }

    if (!isOwner(req.user.id, news.authorId)) {
      return res.status(403).json({ error: "No autorizado." });
    }

    await database.deleteNews(newsId);
    return res.json({ message: "Noticia eliminada correctamente." });
  } catch (err) {
    console.error('Delete news error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Rutas de Foro
app.get("/api/forum/threads", requireAuth, async (req, res) => {
  try {
    const threads = await database.getAllThreads();
    const threadsWithAuthors = await Promise.all(
      threads.map(async (t) => {
        const author = await getUserById(t.authorId);
        const replies = await database.getRepliesByThreadId(t._id);
        return {
          ...t.toObject(),
          authorName: author ? author.displayName : "Usuario eliminado",
          replyCount: replies.length,
        };
      })
    );
    return res.json({ threads: threadsWithAuthors });
  } catch (err) {
    console.error('Get threads error:', err);
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
      title: String(title).trim(),
      body: String(body).trim(),
      authorId: req.user.id,
      createdAt: new Date().toISOString(),
    };

    const createdThread = await database.createThread(thread);
    const author = await getUserById(req.user.id);

    return res.status(201).json({
      thread: {
        ...createdThread.toObject(),
        authorName: author.displayName,
        replyCount: 0,
      },
    });
  } catch (err) {
    console.error('Create thread error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/forum/threads/:threadId", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await database.getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Hilo no encontrado." });
    }

    const author = await getUserById(thread.authorId);
    const replies = await database.getRepliesByThreadId(threadId);
    const repliesWithAuthors = await Promise.all(
      replies.map(async (r) => {
        const replyAuthor = await getUserById(r.authorId);
        return {
          ...r.toObject(),
          authorName: replyAuthor ? replyAuthor.displayName : "Usuario eliminado",
        };
      })
    );

    return res.json({
      thread: {
        ...thread.toObject(),
        authorName: author ? author.displayName : "Usuario eliminado",
        replies: repliesWithAuthors,
      },
    });
  } catch (err) {
    console.error('Get thread error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
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

// Fallback para SPA
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  if (req.path.includes(".")) {
    return res.status(404).send("File not found");
  }
  
  res.sendFile(path.join(publicDir, "index.html"));
});

// Función para asegurar que el admin exista
async function ensureAdminExists() {
  try {
    const existingAdmin = await getUserByEmail("cruel@admin");
    if (existingAdmin) {
      console.log("👑 Admin user already exists");
      return;
    }

    const adminPasswordHash = await bcrypt.hash("123456789", 10);
    const adminUser = {
      email: "cruel@admin",
      inviteCode: "admin-2024",
      passwordHash: adminPasswordHash,
      displayName: "Administrador",
      createdAt: new Date().toISOString(),
    };

    await database.createUser(adminUser);
    console.log("👑 Admin user created successfully");
  } catch (err) {
    console.error("Error creating admin user:", err);
  }
}

// Conectar a MongoDB y iniciar servidor
database.connect()
  .then(async () => {
    // Asegurar que el administrador exista
    await ensureAdminExists();
    
    app.listen(PORT, () => {
      console.log(`🌙 El Rincón del Mentiroso - Servidor iniciado`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`✅ Dominio permitido: @cusco.coar.edu.pe`);
      console.log(`👑 Admin: cruel@admin`);
      console.log(`🚀 Deployment: ${new Date().toISOString()}`);
    });
  })
  .catch((err) => {
    console.error("Error al iniciar:", err);
    process.exit(1);
  });
