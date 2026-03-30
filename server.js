const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const cors = require("cors");

// Configuración
dotenv.config();

// Cargar información de versión
const versionInfo = require('./version.json');
console.log(`🏷️ El Rincón del Mentiroso v${versionInfo.version}`);
console.log(`📄 ${versionInfo.description}`);

// Forzar MONGODB_URI si Render no la encuentra O si no es la dedicada
if (!process.env.MONGODB_URI || 
    (process.env.NODE_ENV === 'production' && 
     !process.env.MONGODB_URI.includes('el-rincon-del-mentiroso'))) {
  process.env.MONGODB_URI = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/el-rincon-del-mentiroso?appName=Cluster0';
  console.log('🔧 Forzando MONGODB_URI a base de datos dedicada en producción');
}

// Debug variables de entorno
console.log('🔍 Variables de entorno:');
console.log('📍 MONGODB_URI:', process.env.MONGODB_URI ? 'DEFINIDA' : 'NO DEFINIDA');
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? 'DEFINIDA' : 'NO DEFINIDA');
console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
console.log('🚪 PORT:', process.env.PORT);

// Verificación específica de producción
if (process.env.NODE_ENV === 'production') {
  console.log('🎯 MODO PRODUCCIÓN DETECTADO');
  
  if (process.env.MONGODB_URI) {
    console.log('📍 MONGODB_URI encontrada en Render');
    
    if (process.env.MONGODB_URI.includes('el-rincon-del-mentiroso')) {
      console.log('✅ Base de datos dedicada configurada correctamente');
    } else {
      console.log('⚠️ Base de datos no es la dedicada');
      console.log('📍 URI original:', process.env.MONGODB_URI.replace(/\/\/[^:]*:[^@]*@/, '//***:***@'));
      console.log('🔄 Forzando cambio a base dedicada...');
      
      // Forzar la base correcta
      process.env.MONGODB_URI = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/el-rincon-del-mentiroso?appName=Cluster0';
      console.log('✅ Base de datos dedicada aplicada');
    }
  } else {
    console.log('❌ MONGODB_URI no configurada en producción');
    console.log('🔄 Configurando base de datos dedicada por defecto...');
    process.env.MONGODB_URI = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/el-rincon-del-mentiroso?appName=Cluster0';
    console.log('✅ Base de datos dedicada configurada');
  }
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
const { User, News, Attachment, Thread, Reply, Mensaje } = require('./models');
const { syncDatabase } = require('./sync-database');

// Conectar a MongoDB
database.connect().then(async () => {
  console.log('🌙 El Rincón del Mentiroso - Servidor iniciado');
  
  // Sincronizar base de datos
  await syncDatabase();
  
  // 🔥 LIMPIEZA AUTOMÁTICA DE MENSAJES CADA VEZ QUE ARRANCA
  try {
    // Comentamos la limpieza para que los mensajes sean permanentes
    // await Mensaje.deleteMany({});
    // console.log('🧹 Limpieza automática: Mensajes antiguos eliminados al iniciar servidor.');
    console.log('💬 Mensajes configurados para ser PERMANENTES');
  } catch (err) {
    console.error('Error en configuración de mensajes:', err);
  }
  
  // 🕅 LIMPIEZA AUTOMÁTICA CADA 24 HORAS (COMENTADA)
  // setInterval(async () => {
  //   try {
  //     const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
  //     const result = await database.deleteOldMensajes(cutoffDate);
  //     if (result.changes > 0) {
  //       console.log(`🕅 Limpieza automática 24h: ${result.changes} mensajes eliminados`);
  //     }
  //   } catch (err) {
  //     console.error('Error en limpieza periódica de mensajes:', err);
  //   }
  // }, 24 * 60 * 60 * 1000); // Cada 24 horas
  
  console.log('� Mensajes PERMANENTES - Solo el admin puede borrarlos');
  
  // Asegurar que el admin exista
  ensureAdminExists();
  
  // 🔄 INICIAR WEBSOCKET PARA MENSAJES EN TIEMPO REAL
  startWebSocket();
}).catch(err => {
  console.error('❌ Error al iniciar:', err);
  process.exit(1);
});

// 🔄 WebSocket para mensajes en tiempo real
function startWebSocket() {
  console.log('🔄 Iniciando WebSocket para mensajes en tiempo real...');
  
  // Almacen de usuarios conectados
  const connectedUsers = new Map();
  
  io.use((socket, next) => {
    // Autenticar WebSocket con JWT
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token requerido'));
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.sub;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`🔌 Usuario conectado: ${socket.userEmail}`);
    
    // Guardar usuario conectado
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      email: socket.userEmail,
      connectedAt: new Date()
    });
    
    // Notificar a todos que usuario se conectó
    socket.broadcast.emit('user_connected', {
      userId: socket.userId,
      email: socket.userEmail,
      timestamp: new Date().toISOString()
    });
    
    // Enviar lista de usuarios conectados
    const usersList = Array.from(connectedUsers.entries()).map(([userId, data]) => ({
      userId,
      email: data.email,
      connectedAt: data.connectedAt
    }));
    
    socket.emit('users_list', usersList);
    
    // 📬 ENVIAR MENSAJE PRIVADO EN TIEMPO REAL
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;
        
        if (!receiverId || !content) {
          socket.emit('error', { message: 'Faltan datos' });
          return;
        }
        
        // Verificar que el receptor exista
        const receiver = await getUserById(receiverId);
        if (!receiver) {
          socket.emit('error', { message: 'Usuario no encontrado' });
          return;
        }
        
        // Guardar mensaje en base de datos
        const mensaje = {
          senderId: socket.userId,
          receiverId,
          content: String(content).trim(),
          createdAt: new Date().toISOString()
        };
        
        const savedMensaje = await database.createMensaje(mensaje);
        
        // Preparar mensaje con nombres
        const mensajeConNombres = {
          ...savedMensaje,
          senderName: socket.userEmail,
          receiverName: receiver.displayName,
          senderId: socket.userId,
          receiverId: receiverId
        };
        
        console.log(`💬 Mensaje en tiempo real: ${socket.userEmail} → ${receiver.displayName}`);
        
        // Enviar al receptor si está conectado
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('new_message', mensajeConNombres);
          console.log(`📨 Mensaje entregado en tiempo real a: ${receiver.displayName}`);
        }
        
        // Confirmar al emisor
        socket.emit('message_sent', {
          ...mensajeConNombres,
          delivered: !!receiverSocket,
          timestamp: new Date().toISOString()
        });
        
      } catch (err) {
        console.error('Error en send_message:', err);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });
    
    // 📖 MARCAR MENSAJE COMO LEÍDO
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;
        await database.markMensajeAsRead(messageId, socket.userId);
        
        // Notificar al emisor que el mensaje fue leído
        const updatedMessage = await database.getMensajeById(messageId);
        if (updatedMessage) {
          const senderSocket = connectedUsers.get(updatedMessage.senderId);
          if (senderSocket) {
            io.to(senderSocket.socketId).emit('message_read', {
              messageId,
              readBy: socket.userEmail,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        socket.emit('message_marked_read', { messageId });
        
      } catch (err) {
        console.error('Error en mark_read:', err);
        socket.emit('error', { message: 'Error al marcar mensaje' });
      }
    });
    
    // 🔌 DESCONECTAR
    socket.on('disconnect', () => {
      console.log(`🔌 Usuario desconectado: ${socket.userEmail}`);
      
      // Eliminar usuario conectado
      connectedUsers.delete(socket.userId);
      
      // Notificar a todos que usuario se desconectó
      socket.broadcast.emit('user_disconnected', {
        userId: socket.userId,
        email: socket.userEmail,
        timestamp: new Date().toISOString()
      });
    });
  });
  
  console.log('✅ WebSocket iniciado para mensajes en tiempo real');
}

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
      id: user.id, 
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

app.get("/api/version", (req, res) => {
  try {
    const versionInfo = require('./version.json');
    return res.json({
      version: versionInfo.version,
      name: versionInfo.name,
      description: versionInfo.description,
      lastUpdate: versionInfo.changelog[0]?.date || new Date().toISOString().split('T')[0],
      features: versionInfo.changelog[0]?.features || []
    });
  } catch (error) {
    return res.json({ 
      version: "1.0.0", 
      name: "El Rincón del Mentiroso",
      description: "Sistema de comunicación educativa"
    });
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
          ...n,
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
          newsId: createdNews.id,
          originalName: f.originalname,
          storedName: f.filename,
          mime: f.mimetype,
          size: f.size,
          createdAt: new Date().toISOString(),
        });
      }

      const result = {
        id: createdNews.id,
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
        const replies = await database.getRepliesByThreadId(t.id);
        return {
          ...t,
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
          ...r,
          authorName: replyAuthor ? replyAuthor.displayName : "Usuario eliminado",
        };
      })
    );

    return res.json({
      thread: {
        ...thread,
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

// Rutas de Mensajes Privados
app.get("/api/mensajes", requireAuth, async (req, res) => {
  try {
    const mensajes = await database.getMensajesByUserId(req.user.id);
    const mensajesConNombres = await Promise.all(
      mensajes.map(async (msg) => {
        const sender = await getUserById(msg.senderId);
        const receiver = await getUserById(msg.receiverId);
        return {
          ...msg,
          senderName: sender ? sender.displayName : "Usuario eliminado",
          receiverName: receiver ? receiver.displayName : "Usuario eliminado",
          isFromMe: msg.senderId.toString() === req.user.id
        };
      })
    );
    return res.json({ mensajes: mensajesConNombres });
  } catch (err) {
    console.error('Get mensajes error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.post("/api/mensajes", requireAuth, async (req, res) => {
  try {
    const { receiverId, content } = req.body || {};
    if (!receiverId || !content) {
      return res.status(400).json({ error: "Faltan datos (destinatario y mensaje)." });
    }

    // Verificar que el receptor exista
    const receiver = await getUserById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const mensaje = {
      senderId: req.user.id,
      receiverId,
      content: String(content).trim(),
      createdAt: new Date().toISOString()
    };

    await database.createMensaje(mensaje);
    console.log(`💬 Mensaje enviado de ${req.user.email} a ${receiver.email}`);
    
    return res.status(201).json({
      message: "Mensaje enviado correctamente",
      receiverName: receiver.displayName
    });
  } catch (err) {
    console.error('Send mensaje error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.put("/api/mensajes/:mensajeId/read", requireAuth, async (req, res) => {
  try {
    const { mensajeId } = req.params;
    await database.markMensajeAsRead(mensajeId, req.user.id);
    return res.json({ message: "Mensaje marcado como leído" });
  } catch (err) {
    console.error('Mark mensaje read error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Rutas de Administración de Mensajes
app.delete("/api/admin/mensajes", requireAuth, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.email !== "cruel@admin") {
      return res.status(403).json({ error: "Acceso denegado. Solo el administrador puede borrar mensajes." });
    }

    // Borrar TODOS los mensajes de la base de datos
    const result = await Mensaje.deleteMany({});
    
    console.log(`🗑️ Admin ${req.user.email} borró ${result.deletedCount} mensajes`);
    
    return res.json({ 
      message: "Todos los mensajes han sido eliminados",
      deletedCount: result.deletedCount,
      deletedBy: req.user.email,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error al borrar mensajes:', err);
    return res.status(500).json({ error: "Error interno al borrar mensajes" });
  }
});

// Ruta para obtener estadísticas de mensajes (solo admin)
app.get("/api/admin/mensajes/stats", requireAuth, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.email !== "cruel@admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    // Obtener estadísticas
    const totalMensajes = await Mensaje.countDocuments();
    const mensajesHoy = await Mensaje.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0,0,0,0))
      }
    });
    
    // Obtener mensajes por usuario
    const mensajesPorUsuario = await Mensaje.aggregate([
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return res.json({
      totalMensajes,
      mensajesHoy,
      topUsuarios: mensajesPorUsuario,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/mensajes/unread/count", requireAuth, async (req, res) => {
  try {
    const count = await database.getUnreadCount(req.user.id);
    return res.json({ unreadCount: count });
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
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
    
    // Iniciar servidor
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🌙 El Rincón del Mentiroso - Servidor iniciado en puerto ${PORT}`);
      console.log(`🔌 WebSocket disponible para mensajes en tiempo real`);
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
