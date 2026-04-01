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
    // Configuración SOLO para producción en Render
    origin: "https://el-rincon-del-mentiroso.onrender.com",
    methods: ["GET", "POST"],
    credentials: true, // Importante para cookies y autenticación
    allowedHeaders: ["Content-Type", "Authorization"] // Headers permitidos
  },
  // Configuración optimizada para producción en Render
  allowEIO3: true, // Compatibilidad con clientes antiguos
  transports: ["websocket", "polling"], // Métodos de transporte
  // Configuración de seguridad para Render
  maxHttpBufferSize: 1e8, // 100 MB
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3000;
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

function isAdminEmail(email) {
  return normalizeEmail(email) === "cruel@admin";
}

function ensureAdminRequest(req, res) {
  if (!isAdminEmail(req.user?.email)) {
    res.status(403).json({ error: "Acceso denegado" });
    return false;
  }
  return true;
}

function removeUploadFile(storedName) {
  if (!storedName) return;

  const filePath = path.join(uploadsDir, storedName);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Error eliminando archivo adjunto ${storedName}:`, err);
  }
}

function toPlainObject(doc) {
  if (!doc) return null;
  if (typeof doc.toObject === "function") return doc.toObject();
  return doc;
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
const { User, News, Attachment, Thread, Reply, Mensaje, Post, Comment } = require('./models');
const { syncDatabase } = require('./sync-database');

/* Bloque de arranque antiguo desactivado; el arranque real está al final del archivo.
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
*/
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
      
      // Obtener datos completos del usuario
      getUserById(decoded.sub).then(user => {
        if (user) {
          socket.userDisplayName = user.displayName;
          socket.userInviteCode = user.inviteCode;
        }
      }).catch(err => {
        console.error('Error obteniendo datos del usuario:', err);
      });
      
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
      displayName: socket.userDisplayName,
      userCode: censorInviteCode(socket.userInviteCode),
      connectedAt: new Date()
    });
    
    // Notificar a todos que usuario se conectó
    socket.broadcast.emit('user_connected', {
      userId: socket.userId,
      email: socket.userEmail,
      displayName: socket.userDisplayName,
      userCode: censorInviteCode(socket.userInviteCode),
      timestamp: new Date().toISOString()
    });
    
    // Enviar lista de usuarios conectados
    const usersList = Array.from(connectedUsers.entries()).map(([userId, data]) => ({
      userId,
      email: data.email,
      displayName: data.displayName,
      userCode: data.userCode,
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
        
        console.log(`💬 Mensaje privado: ${socket.userEmail} → ${receiver.displayName}`);
        
        // Enviar al receptor específico si está conectado
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          // Enviar SOLO al destinatario
          io.to(receiverSocket.socketId).emit('new_message', mensajeConNombres);
          console.log(`📨 Mensaje entregado a: ${receiver.displayName}`);
          
          // Confirmar al emisor que fue entregado
          socket.emit('message_sent', {
            ...mensajeConNombres,
            delivered: true,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log(`⏳ Usuario ${receiver.displayName} no está conectado. Mensaje guardado.`);
          
          // Confirmar al emisor que fue guardado pero no entregado
          socket.emit('message_sent', {
            ...mensajeConNombres,
            delivered: false,
            timestamp: new Date().toISOString()
          });
        }
        
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

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        inviteCode: user.inviteCode,
      },
    });
  } catch (err) {
    console.error("Get auth/me error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Rutas de Noticias
app.get("/api/news", async (req, res) => {
  try {
    const news = await database.getAllNews();
    const newsWithAuthors = await Promise.all(
      news.map(async (n) => {
        const plainNews = toPlainObject(n);
        const author = await getUserById(n.authorId);
        return {
          id: plainNews._id?.toString?.() || plainNews.id,
          title: plainNews.title,
          content: plainNews.content,
          authorId: plainNews.authorId?.toString?.() || plainNews.authorId,
          createdAt: plainNews.createdAt,
          authorName: author ? author.displayName : "Usuario eliminado",
          authorCode: author ? censorInviteCode(author.inviteCode) : "N/A",
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
      const author = await getUserById(req.user.id);

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
        authorName: author.displayName,
        authorCode: censorInviteCode(author.inviteCode),
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
        const plainThread = toPlainObject(t);
        const author = await getUserById(t.authorId);
        const replies = await database.getRepliesByThreadId(t.id);
        return {
          id: plainThread._id?.toString?.() || plainThread.id,
          title: plainThread.title,
          body: plainThread.body,
          authorId: plainThread.authorId?.toString?.() || plainThread.authorId,
          createdAt: plainThread.createdAt,
          authorName: author ? author.displayName : "Usuario eliminado",
          authorCode: author ? censorInviteCode(author.inviteCode) : "N/A",
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
        authorCode: censorInviteCode(author.inviteCode),
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
        const plainReply = toPlainObject(r);
        const replyAuthor = await getUserById(r.authorId);
        return {
          id: plainReply._id?.toString?.() || plainReply.id,
          threadId: plainReply.threadId?.toString?.() || plainReply.threadId,
          authorId: plainReply.authorId?.toString?.() || plainReply.authorId,
          body: plainReply.body,
          createdAt: plainReply.createdAt,
          authorName: replyAuthor ? replyAuthor.displayName : "Usuario eliminado",
          authorCode: replyAuthor ? censorInviteCode(replyAuthor.inviteCode) : "N/A",
        };
      })
    );

    const plainThread = toPlainObject(thread);

    return res.json({
      thread: {
        id: plainThread._id?.toString?.() || plainThread.id,
        title: plainThread.title,
        body: plainThread.body,
        authorId: plainThread.authorId?.toString?.() || plainThread.authorId,
        createdAt: plainThread.createdAt,
        authorName: author ? author.displayName : "Usuario eliminado",
        authorCode: author ? censorInviteCode(author.inviteCode) : "N/A",
        replies: repliesWithAuthors,
      },
    });
  } catch (err) {
    console.error('Get thread error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Ruta para crear respuestas en hilos
app.post("/api/forum/threads/:threadId/replies", requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { body } = req.body || {};
    
    if (!body) {
      return res.status(400).json({ error: "Falta el campo: body." });
    }

    // Verificar que el hilo exista
    const thread = await database.getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Hilo no encontrado." });
    }

    const reply = {
      body: String(body).trim(),
      authorId: req.user.id,
      threadId: threadId,
      createdAt: new Date().toISOString(),
    };

    const createdReply = await database.createReply(reply);
    const author = await getUserById(req.user.id);

    return res.status(201).json({
      reply: {
        ...createdReply.toObject(),
        authorName: author.displayName,
        authorCode: censorInviteCode(author.inviteCode),
      },
    });
  } catch (err) {
    console.error('Create reply error:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// ============================================
// RUTAS API DEL FORO DE MENTIRAS (POSTS)
// ============================================

// GET /api/posts - Obtener todas las mentiras (posts)
app.get("/api/posts", requireAuth, async (req, res) => {
  try {
    const posts = await database.getAllPosts();
    
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await getUserById(post.authorId);
        return {
          id: post._id,
          titulo: post.titulo,
          contenido: post.contenido,
          fecha: post.fecha,
          usuario: author ? author.displayName : "Anónimo",
          esAutor: post.authorId.toString() === req.user.id
        };
      })
    );
    
    return res.json({ posts: postsWithAuthors });
  } catch (err) {
    console.error('❌ Get posts error:', err);
    return res.status(500).json({ error: "Error al cargar posts" });
  }
});

// POST /api/posts - Crear nueva mentira (post)
app.post("/api/posts", requireAuth, async (req, res) => {
  try {
    const { titulo, contenido } = req.body || {};
    
    if (!titulo || !contenido) {
      return res.status(400).json({ error: "Título y contenido son requeridos" });
    }
    
    const post = {
      authorId: req.user.id,
      titulo: String(titulo).trim(),
      contenido: String(contenido).trim(),
      fecha: new Date().toISOString(),
      usuario: req.user.email
    };
    
    const savedPost = await database.createPost(post);
    
    const author = await getUserById(req.user.id);
    const postWithAuthor = {
      id: savedPost._id,
      titulo: savedPost.titulo,
      contenido: savedPost.contenido,
      fecha: savedPost.fecha,
      usuario: author ? author.displayName : "Anónimo",
      esAutor: true
    };
    
    return res.status(201).json(postWithAuthor);
  } catch (err) {
    console.error('❌ Create post error:', err);
    return res.status(500).json({ error: "Error al crear post" });
  }
});

// POST /api/posts/:postId/comments - Agregar comentario a un post
app.post("/api/posts/:postId/comments", requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body || {};
    
    if (!content) {
      return res.status(400).json({ error: "Contenido del comentario es requerido" });
    }
    
    console.log(`💬 Agregando comentario al post ${postId} por ${req.user.email}`);
    
    // Verificar que el post existe
    const post = await database.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }
    
    const comment = {
      postId,
      authorId: req.user.id,
      content: String(content).trim(),
      createdAt: new Date().toISOString()
    };
    
    const savedComment = await database.createComment(comment);
    
    // Agregar información del autor
    const author = await getUserById(req.user.id);
    const plainComment = toPlainObject(savedComment);
    const commentWithAuthor = {
      id: plainComment._id?.toString?.() || plainComment.id,
      postId: plainComment.postId?.toString?.() || plainComment.postId,
      authorId: plainComment.authorId?.toString?.() || plainComment.authorId,
      content: plainComment.content,
      createdAt: plainComment.createdAt,
      authorName: author ? author.displayName : "Anónimo",
      authorCode: author ? censorInviteCode(author.inviteCode) : "N/A"
    };
    
    console.log(`✅ Comentario creado: ${savedComment.id}`);
    return res.status(201).json(commentWithAuthor);
  } catch (err) {
    console.error('Create comment error:', err);
    return res.status(500).json({ error: "Error al crear comentario" });
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
          senderCode: sender ? censorInviteCode(sender.inviteCode) : "N/A",
          receiverName: receiver ? receiver.displayName : "Usuario eliminado",
          receiverCode: receiver ? censorInviteCode(receiver.inviteCode) : "N/A",
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

// Ruta para obtener mensajes entre dos usuarios específicos
app.get("/api/mensajes/:receiverId", requireAuth, async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user.id;
    
    // Obtener mensajes entre los dos usuarios
    const mensajes = await database.getMensajesEntreUsuarios(senderId, receiverId);
    
    // Agregar información de los usuarios
    const mensajesConNombres = await Promise.all(
      mensajes.map(async (msg) => {
        const sender = await getUserById(msg.senderId);
        const receiver = await getUserById(msg.receiverId);
        return {
          ...msg,
          senderName: sender ? sender.displayName : "Usuario eliminado",
          senderCode: sender ? censorInviteCode(sender.inviteCode) : "N/A",
          receiverName: receiver ? receiver.displayName : "Usuario eliminado",
          receiverCode: receiver ? censorInviteCode(receiver.inviteCode) : "N/A",
          isFromMe: msg.senderId.toString() === senderId
        };
      })
    );
    
    return res.json({ mensajes: mensajesConNombres });
  } catch (err) {
    console.error('Get mensajes between users error:', err);
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

// Rutas de Administración General
app.get("/api/admin/stats", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

    const stats = {
      totalUsers: await User.countDocuments(),
      totalNews: await News.countDocuments(),
      totalThreads: await Thread.countDocuments(),
      totalReplies: await Reply.countDocuments(),
      totalAttachments: await Attachment.countDocuments(),
      totalMensajes: await Mensaje.countDocuments(),
      timestamp: new Date().toISOString()
    };

    return res.json({ stats });
  } catch (err) {
    console.error('Error en stats admin:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/admin/users", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

    const users = await database.getAllUsers();
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const userId = user.id;
        return {
          id: userId,
          email: user.email,
          displayName: user.displayName,
          inviteCode: user.inviteCode,
          censoredInviteCode: censorInviteCode(user.inviteCode),
          createdAt: user.createdAt,
          stats: {
            newsCount: await News.countDocuments({ authorId: userId }),
            threadsCount: await Thread.countDocuments({ authorId: userId }),
            repliesCount: await Reply.countDocuments({ authorId: userId }),
            mensajesCount: await Mensaje.countDocuments({
              $or: [{ senderId: userId }, { receiverId: userId }],
            }),
          },
        };
      })
    );
    return res.json({ users: usersWithDetails });
  } catch (err) {
    console.error('Error en users admin:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/admin/news", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

    const news = await database.getAllNews();
    const newsWithDetails = await Promise.all(
      news.map(async (item) => {
        const author = await getUserById(item.authorId);
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          createdAt: item.createdAt,
          authorId: item.authorId,
          authorName: author ? author.displayName : "Usuario eliminado",
          authorEmail: author ? author.email : "N/A",
          authorCode: author ? censorInviteCode(author.inviteCode) : "N/A",
          attachments: await database.getAttachmentsByNewsId(item.id),
        };
      })
    );
    return res.json({ news: newsWithDetails });
  } catch (err) {
    console.error('Error en news admin:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.get("/api/admin/threads", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

    const threads = await database.getAllThreads();
    const threadsWithDetails = await Promise.all(
      threads.map(async (thread) => {
        const author = await getUserById(thread.authorId);
        const replies = await database.getRepliesByThreadId(thread.id);
        const repliesWithAuthors = await Promise.all(
          replies.map(async (reply) => {
            const replyAuthor = await getUserById(reply.authorId);
            return {
              id: reply.id,
              authorId: reply.authorId,
              body: reply.body,
              createdAt: reply.createdAt,
              authorName: replyAuthor ? replyAuthor.displayName : "Usuario eliminado",
              authorEmail: replyAuthor ? replyAuthor.email : "N/A",
              authorCode: replyAuthor ? censorInviteCode(replyAuthor.inviteCode) : "N/A",
            };
          })
        );

        return {
          id: thread.id,
          title: thread.title,
          body: thread.body,
          createdAt: thread.createdAt,
          authorId: thread.authorId,
          authorName: author ? author.displayName : "Usuario eliminado",
          authorEmail: author ? author.email : "N/A",
          authorCode: author ? censorInviteCode(author.inviteCode) : "N/A",
          replyCount: repliesWithAuthors.length,
          replies: repliesWithAuthors,
        };
      })
    );
    return res.json({ threads: threadsWithDetails });
  } catch (err) {
    console.error('Error en threads admin:', err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.delete("/api/admin/news/:newsId", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

    const { newsId } = req.params;
    const news = await database.getNewsById(newsId);
    if (!news) {
      return res.status(404).json({ error: "Noticia no encontrada" });
    }

    const attachments = await database.getAttachmentsByNewsId(newsId);
    attachments.forEach((attachment) => removeUploadFile(attachment.storedName));
    await Attachment.deleteMany({ newsId });
    await database.deleteNews(newsId);

    return res.json({ message: "Noticia eliminada correctamente" });
  } catch (err) {
    console.error("Error en admin delete news:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.delete("/api/admin/threads/:threadId", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

    const { threadId } = req.params;
    const thread = await database.getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Hilo no encontrado" });
    }

    await Reply.deleteMany({ threadId });
    await database.deleteThread(threadId);

    return res.json({ message: "Hilo eliminado correctamente" });
  } catch (err) {
    console.error("Error en admin delete thread:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.post("/api/admin/users/:userId/reset-password", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

    const { userId } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await database.updateUserPassword(userId, passwordHash);

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error en admin reset password:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.delete("/api/admin/users/:userId", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

    const { userId } = req.params;
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (isAdminEmail(user.email)) {
      return res.status(400).json({ error: "No se puede eliminar la cuenta administradora" });
    }

    if (isOwner(req.user.id, userId)) {
      return res.status(400).json({ error: "No puedes eliminar tu propia cuenta desde el panel admin" });
    }

    const userNews = await News.find({ authorId: userId });
    const userNewsIds = userNews.map((item) => item.id);
    if (userNewsIds.length > 0) {
      const attachments = await Attachment.find({ newsId: { $in: userNewsIds } });
      attachments.forEach((attachment) => removeUploadFile(attachment.storedName));
      await Attachment.deleteMany({ newsId: { $in: userNewsIds } });
      await News.deleteMany({ authorId: userId });
    }

    const userThreads = await Thread.find({ authorId: userId });
    const userThreadIds = userThreads.map((item) => item.id);
    if (userThreadIds.length > 0) {
      await Reply.deleteMany({ threadId: { $in: userThreadIds } });
      await Thread.deleteMany({ authorId: userId });
    }

    const userPosts = await Post.find({ authorId: userId });
    const userPostIds = userPosts.map((item) => item.id);
    if (userPostIds.length > 0) {
      await Comment.deleteMany({ postId: { $in: userPostIds } });
      await Post.deleteMany({ authorId: userId });
    }

    await Reply.deleteMany({ authorId: userId });
    await Comment.deleteMany({ authorId: userId });
    await Mensaje.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });
    await User.findByIdAndDelete(userId);

    return res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("Error en admin delete user:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Rutas de Administración de Mensajes
app.delete("/api/admin/mensajes", requireAuth, async (req, res) => {
  try {
    if (!ensureAdminRequest(req, res)) return;

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
    if (!ensureAdminRequest(req, res)) return;

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
    await syncDatabase();
    await startWebSocket();
    await ensureAdminExists();

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
