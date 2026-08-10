import express from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Post, Comment } from "../models/Forum.js";
import { TeacherRating, Bet, LostItem, News } from "../models/Community.js";
import { Notification } from "../models/Notification.js";
import { escapeRegex } from "../lib/escapeRegex.js";
import { isValidObjectId } from "../lib/ids.js";
import { isPostCategory } from "../constants/forum.js";
import { requireAuth, requireActiveUser, requireRole } from "../middleware/auth.js";
import { routeAsync } from "../middleware/routeAsync.js";
import { validarContenidoLimpio } from "../middleware/validarContenido.js";

const router = express.Router();

const MAX_POST_TITLE = 280;
const MAX_POST_BODY = 50_000;
const MAX_COMMENT = 10_000;

const requireDb: express.RequestHandler = (req: any, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "Base de datos no disponible" });
    return;
  }
  next();
};

const modRoles = requireRole("semiadmin", "admin", "superadmin");
const modChain = [requireDb, requireAuth, requireActiveUser, modRoles];

const authed = [requireDb, requireAuth, requireActiveUser];

// --- LEADERBOARD (Público pero solo para usuarios verificados) ---
router.get("/users/leaderboard", ...authed, async (req: any, res) => {
  try {
    if (!req.user?.email?.endsWith("@cusco.coar.edu.pe") || !req.user?.isVerified) {
      return res.status(403).json({ error: "Solo usuarios verificados del COAR pueden acceder al ranking" });
    }
    
    const leaderboard = await User.find(
      { isVerified: true, banned: false, email: { $regex: "@cusco.coar.edu.pe$" } },
      { nombreCompleto: 1, displayName: 1, name: 1, credits: 1, añoIngreso: 1, ingresoColegio: 1 }
    )
      .sort({ credits: -1 })
      .limit(10)
      .lean();

    const formattedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      name: user.displayName || user.nombreCompleto || user.name || "Anónimo",
      credits: user.credits,
      añoIngreso: user.añoIngreso || user.ingresoColegio
    }));
    
    res.json(formattedLeaderboard);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- COMPRAR MONEDAS ---
router.post("/users/buy-coins", ...authed, async (req: any, res) => {
  try {
    if (!req.user?.email?.endsWith("@cusco.coar.edu.pe") || !req.user?.isVerified) {
      return res.status(403).json({ error: "Solo usuarios verificados del COAR pueden comprar monedas" });
    }

    const { package: packageName } = req.body;
    let coinsToAdd = 0;

    switch (packageName) {
      case "basic":
        coinsToAdd = 100;
        break;
      case "standard":
        coinsToAdd = 500;
        break;
      case "premium":
        coinsToAdd = 2000;
        break;
      default:
        return res.status(400).json({ error: "Paquete inválido" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { credits: coinsToAdd } },
      { new: true }
    );

    res.json({ ok: true, user: updatedUser, coinsAdded: coinsToAdd });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- FORUM ---
router.get("/posts", ...authed, async (req: any, res) => {
  try {
    const { q, author, category, startDate, endDate } = req.query;
    const filter: Record<string, unknown> = {};

    if (q && String(q).length > 200) {
      res.status(400).json({ error: "Búsqueda demasiado larga" });
      return;
    }
    if (q) {
      const safe = escapeRegex(String(q));
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { content: { $regex: safe, $options: "i" } },
      ];
    }

    if (author) {
      const safeAuthor = escapeRegex(String(author).slice(0, 120));
      const userDoc = await User.findOne({
        name: { $regex: safeAuthor, $options: "i" },
      });
      if (userDoc) filter.author = userDoc._id;
    }

    if (category && category !== "all") {
      if (!isPostCategory(String(category))) {
        res.status(400).json({ error: "Categoría no válida" });
        return;
      }
      filter.category = category;
    }

    if (startDate || endDate) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        const d = new Date(String(startDate));
        if (Number.isNaN(d.getTime())) {
          res.status(400).json({ error: "Fecha inicial inválida" });
          return;
        }
        range.$gte = d;
      }
      if (endDate) {
        const d = new Date(String(endDate));
        if (Number.isNaN(d.getTime())) {
          res.status(400).json({ error: "Fecha final inválida" });
          return;
        }
        range.$lte = d;
      }
      filter.createdAt = range;
    }

    const { page, limit, skip } = parsePagination(req.query, 20, 50);
    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "name role ingresoColegio")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);
    res.json({
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/posts", ...authed, validarContenidoLimpio(['title', 'content']), async (req: any, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";
    const rawCat = typeof body.category === "string" ? body.category : "General";
    const category = isPostCategory(rawCat) ? rawCat : "General";

    if (!title || !content) {
      res.status(400).json({ error: "Título y contenido son obligatorios" });
      return;
    }
    if (title.length > MAX_POST_TITLE || content.length > MAX_POST_BODY) {
      res.status(400).json({ error: "Texto demasiado largo" });
      return;
    }

    const user = req.user as { _id: mongoose.Types.ObjectId; credits?: number };
    const post = await Post.create({
      title,
      content,
      category,
      author: user._id,
    });

    user.credits = (user.credits ?? 0) + 5;
    await (req.user as { save: () => Promise<unknown> }).save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/posts/:id", ...authed, async (req: any, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name role ingresoColegio"
    );
    if (!post) {
      res.status(404).json({ error: "Post no encontrado" });
      return;
    }
    post.views += 1;
    await post.save();
    const comments = await Comment.find({ post: post._id })
      .populate("author", "name role ingresoColegio")
      .sort({ createdAt: 1 });
    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/posts/:id/comments", ...authed, async (req: any, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: "Post no encontrado" });
      return;
    }

    const content =
      typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) {
      res.status(400).json({ error: "Comentario vacío" });
      return;
    }
    if (content.length > MAX_COMMENT) {
      res.status(400).json({ error: "Comentario demasiado largo" });
      return;
    }

    const user = req.user as {
      _id: mongoose.Types.ObjectId;
      name: string;
      credits?: number;
    };

    const comment = await Comment.create({
      content,
      author: user._id,
      post: post._id,
    });

    if (post.author.toString() !== user._id.toString()) {
      const notif = await Notification.create({
        recipient: post.author,
        sender: user._id,
        type: "comment",
        post: post._id,
        content: `${user.name} comentó en tu publicación: "${post.title}"`,
      });

      const recipientSocket = req.userSockets.get(post.author.toString());
      if (recipientSocket) {
        req.io.to(recipientSocket).emit("notification", notif);
      }
    }

    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.slice(1);
        const mentionedUser = await User.findOne({
          name: new RegExp(`^${escapeRegex(username)}$`, "i"),
        });
        if (
          mentionedUser &&
          mentionedUser._id.toString() !== user._id.toString()
        ) {
          const mNotif = await Notification.create({
            recipient: mentionedUser._id,
            sender: user._id,
            type: "mention",
            post: post._id,
            content: `${user.name} te mencionó en un comentario.`,
          });
          const mSocket = req.userSockets.get(mentionedUser._id.toString());
          if (mSocket) {
            req.io.to(mSocket).emit("notification", mNotif);
          }
        }
      }
    }

    user.credits = (user.credits ?? 0) + 2;
    await (req.user as { save: () => Promise<unknown> }).save();

    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- NOTIFICATIONS ---
router.get("/notifications", ...authed, async (req: any, res) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };
    const notifs = await Notification.find({ recipient: user._id })
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch("/notifications/read", ...authed, async (req: any, res) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };
    await Notification.updateMany(
      { recipient: user._id, read: false },
      { read: true }
    );
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/notifications/mark-all-read", ...authed, async (req: any, res) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };
    await Notification.updateMany(
      { recipient: user._id, read: false },
      { read: true }
    );
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- BETS (créditos / predicciones) ---
router.get("/bets/events", ...authed, async (_req: any, res) => {
  try {
    const bets = await Bet.find({ status: { $in: ["open", "closed"] } })
      .sort({ createdAt: -1 })
      .select("event status options createdAt winner")
      .lean();
    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/bets", ...authed, async (req: any, res) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };
    const bets = await Bet.find({ "participants.user": user._id }).sort({
      updatedAt: -1,
    });
    const uid = user._id.toString();
    const flat = bets.flatMap((b) =>
      b.participants
        .filter(
          (p) =>
            p.user && (p.user as mongoose.Types.ObjectId).toString() === uid
        )
        .map((p) => ({
          _id: `${b._id}_${(p as { _id?: mongoose.Types.ObjectId })._id ?? ""}`,
          event: b.event,
          prediction: p.option,
          amount: p.amount,
          outcome:
            b.status === "resolved"
              ? b.winner === p.option
                ? "won"
                : "lost"
              : undefined,
        }))
    );
    res.json(flat);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/bets", ...authed, async (req: any, res) => {
  try {
    const { event, amount, prediction } = req.body ?? {};
    if (typeof event !== "string" || typeof prediction !== "string") {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1 || !Number.isInteger(amt)) {
      res.status(400).json({ error: "Monto inválido" });
      return;
    }
    const e = event.trim().slice(0, 200);
    const pred = prediction.trim().slice(0, 500);
    if (!e || !pred) {
      res.status(400).json({ error: "Completa evento y predicción" });
      return;
    }

    const userId = (req.user as { _id: mongoose.Types.ObjectId })._id;
    const updated = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: amt }, banned: { $ne: true } },
      { $inc: { credits: -amt } },
      { new: true }
    );
    if (!updated) {
      res
        .status(400)
        .json({ error: "Créditos insuficientes o cuenta no disponible" });
      return;
    }

    let bet = await Bet.findOne({ event: e, status: "open" });
    if (!bet) {
      bet = await Bet.create({
        event: e,
        creator: userId,
        options: [{ name: pred, pool: amt }],
        participants: [{ user: userId, option: pred, amount: amt }],
        status: "open",
      });
    } else {
      bet.participants.push({ user: userId, option: pred, amount: amt });
      const opt = bet.options.find((o) => o.name === pred);
      if (opt) opt.pool += amt;
      else bet.options.push({ name: pred, pool: amt });
      await bet.save();
    }

    res.json({ ok: true, credits: updated.credits });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- ADMIN ---
router.get(
  "/admin/stats",
  ...authed,
  requireRole("admin", "superadmin"),
  async (req: any, res) => {
    try {
      const [users, posts, semiadmins, bets] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        User.countDocuments({ role: "semiadmin" }),
        Bet.countDocuments(),
      ]);
      res.json({ users, posts, semiadmins, bets });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// --- ADMIN: USERS ---
router.get(
  "/admin/users",
  ...authed,
  requireRole("admin", "superadmin"),
  async (req: any, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 }).lean();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

router.patch(
  "/admin/users/:id",
  ...authed,
  requireRole("admin", "superadmin"),
  async (req: any, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const { role, banned, credits } = req.body;
      const updateData: Record<string, unknown> = {};
      
      if (role !== undefined) updateData.role = role;
      if (banned !== undefined) updateData.banned = banned;
      if (credits !== undefined) updateData.credits = credits;
      
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// --- ADMIN: BETS ---
router.post(
  "/admin/bets",
  ...authed,
  requireRole("admin", "superadmin"),
  async (req: any, res) => {
    try {
      const { event, options } = req.body ?? {};
      if (typeof event !== "string" || !event.trim()) {
        return res.status(400).json({ error: "Nombre del evento requerido" });
      }
      const e = event.trim().slice(0, 200);
      const optionNames: string[] = Array.isArray(options)
        ? options
            .filter((o: unknown) => typeof o === "string" && o.trim())
            .map((o: string) => o.trim().slice(0, 500))
        : [];
      const bet = await Bet.create({
        event: e,
        creator: (req.user as { _id: mongoose.Types.ObjectId })._id,
        options: optionNames.length
          ? optionNames.map((name) => ({ name, pool: 0 }))
          : [{ name: "Opción A", pool: 0 }, { name: "Opción B", pool: 0 }],
        participants: [],
        status: "open",
      });
      res.status(201).json(bet);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

router.get(
  "/admin/bets",
  ...authed,
  requireRole("admin", "superadmin"),
  async (req: any, res) => {
    try {
      const bets = await Bet.find()
        .populate("creator", "name email")
        .sort({ createdAt: -1 })
        .lean();
      res.json(bets);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

router.patch(
  "/admin/bets/:id",
  ...authed,
  requireRole("admin", "superadmin"),
  async (req: any, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const { status, winner } = req.body;
      const bet = await Bet.findById(req.params.id);
      
      if (!bet) {
        return res.status(404).json({ error: "Apuesta no encontrada" });
      }
      
      if (status) bet.status = status;
      if (winner) {
        bet.winner = winner;
        
        // Distribuir ganancias si la apuesta se resuelve
        if (status === "resolved") {
          const totalPool = bet.options.reduce((sum, opt) => sum + opt.pool, 0);
          const winningOption = bet.options.find(opt => opt.name === winner);
          
          if (winningOption && winningOption.pool > 0) {
            const winningParticipants = bet.participants.filter(p => p.option === winner);
            const totalWinnersAmount = winningParticipants.reduce((sum, p) => sum + (p.amount || 0), 0);
            
            for (const participant of winningParticipants) {
              if (participant.amount && totalWinnersAmount > 0) {
                const userWinnings = Math.floor((participant.amount / totalWinnersAmount) * totalPool);
                await User.findByIdAndUpdate(
                  participant.user,
                  { $inc: { credits: userWinnings } }
                );
              }
            }
          }
        }
      }
      
      await bet.save();
      res.json(bet);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

router.delete(
  "/admin/bets/:id",
  ...authed,
  requireRole("admin", "superadmin"),
  async (req: any, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const bet = await Bet.findById(req.params.id);
      if (!bet) {
        return res.status(404).json({ error: "Apuesta no encontrada" });
      }
      
      // Devolver créditos a los participantes
      for (const participant of bet.participants) {
        await User.findByIdAndUpdate(
          participant.user,
          { $inc: { credits: participant.amount } }
        );
      }
      
      await Bet.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// --- MODERACIÓN FORO ---
router.get("/admin/forum/posts", ...modChain, async (req: any, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 15, 40);
    const filter: Record<string, unknown> = {};
    const q = req.query.q;
    if (q && String(q).length <= 200) {
      const safe = escapeRegex(String(q));
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { content: { $regex: safe, $options: "i" } },
      ];
    }
    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);
    res.json({
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete("/admin/forum/posts/:id", ...modChain, async (req: any, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Publicación no encontrada" });
      return;
    }
    await Comment.deleteMany({ post: req.params.id });
    await Notification.deleteMany({ post: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete("/admin/forum/comments/:id", ...modChain, async (req: any, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const deleted = await Comment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Comentario no encontrado" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- NEWS ---
router.get("/news", ...authed, async (req: any, res) => {
  try {
    const news = await News.find()
      .populate("author", "name")
      .sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/news", ...authed, requireRole("admin", "superadmin"), async (req: any, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Título y contenido son obligatorios" });
    }
    
    const news = await News.create({
      title,
      content,
      category: category || "ACADEMICO",
      author: (req.user as { _id: mongoose.Types.ObjectId })._id,
    });
    
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete("/news/:id", ...authed, requireRole("admin", "superadmin"), async (req: any, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    
    await News.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- TEACHER RATINGS ---
router.get("/teachers", ...authed, async (req: any, res) => {
  try {
    const teachers = await TeacherRating.find().sort({ rating: -1 }).lean();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/teachers/:id", ...authed, async (req: any, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    
    const teacher = await TeacherRating.findById(req.params.id).lean();
    if (!teacher) {
      return res.status(404).json({ error: "Profesor no encontrado" });
    }
    
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/teachers", ...authed, requireRole("admin", "superadmin"), async (req: any, res) => {
  try {
    const { name, subject } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ error: "Nombre y materia son obligatorios" });
    }
    
    const teacher = await TeacherRating.create({
      name,
      subject,
      rating: 0,
      reviews: [],
    });
    
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete("/teachers/:id", ...authed, requireRole("admin", "superadmin"), async (req: any, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    await TeacherRating.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/teachers/:id/review", ...authed, async (req: any, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { rating, comment } = req.body;
    const user = req.user as { _id: mongoose.Types.ObjectId; name: string };

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating debe ser entre 1 y 5" });
    }

    const teacher = await TeacherRating.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: "Profesor no encontrado" });
    }

    // Verificar si el usuario ya votó
    const existingReview = teacher.reviews?.find((r: any) => r.user?.toString() === user._id.toString());
    if (existingReview) {
      return res.status(400).json({ error: "Ya has calificado a este profesor" });
    }

    const review = {
      user: user._id,
      score: rating,
      comment: comment || '',
      date: new Date(),
    };

    teacher.reviews = teacher.reviews || [];
    teacher.reviews.push(review);

    // Recalcular rating promedio
    const totalRating = teacher.reviews.reduce((sum: number, r: any) => sum + r.score, 0);
    teacher.rating = totalRating / teacher.reviews.length;

    await teacher.save();
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- COMMUNITY FEATURES ---

router.get("/lost-found", ...authed, async (req: any, res) => {
  try {
    const items = await LostItem.find()
      .populate("founder", "name")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/lost-found", ...authed, async (req: any, res) => {
  try {
    const { title, description, location } = req.body;
    const user = req.user as { _id: mongoose.Types.ObjectId };

    if (!title || !description || !location) {
      return res.status(400).json({ error: "Título, descripción y ubicación son obligatorios" });
    }

    const item = await LostItem.create({
      title,
      description,
      location,
      founder: user._id,
      status: 'lost'
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- USER PROFILE ---
router.patch("/user/display-name", ...authed, async (req: any, res) => {
  try {
    const { displayName } = req.body;

    if (!req.user) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    // Verificar si ya ha cambiado el nombre de usuario
    const user = await User.findById((req.user as any)._id).select('+displayNameChanged');
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    if (user.displayNameChanged) {
      res.status(403).json({ error: "Solo puedes cambiar tu nombre de usuario una vez" });
      return;
    }

    if (!displayName || typeof displayName !== 'string') {
      res.status(400).json({ error: "Nombre de usuario es requerido" });
      return;
    }

    if (displayName.length < 3 || displayName.length > 20) {
      res.status(400).json({ error: "El nombre debe tener entre 3 y 20 caracteres" });
      return;
    }

    await User.findByIdAndUpdate((req.user as any)._id, {
      displayName,
      displayNameChanged: true
    });
    res.json({ ok: true, displayName });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch("/user/ingreso-colegio", ...authed, async (req: any, res) => {
  try {
    const { ingresoColegio } = req.body;

    if (!req.user) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    // Verificar si ya ha cambiado el año de ingreso
    const user = await User.findById((req.user as any)._id).select('+ingresoColegioChanged');
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    if (user.ingresoColegioChanged) {
      res.status(403).json({ error: "Solo puedes cambiar tu año de ingreso una vez" });
      return;
    }

    // Validar que el año sea 2024, 2025 o 2026
    const allowedYears = [2024, 2025, 2026];
    if (typeof ingresoColegio !== 'number' || !allowedYears.includes(ingresoColegio)) {
      res.status(400).json({ error: "El año de ingreso debe ser 2024, 2025 o 2026" });
      return;
    }

    await User.findByIdAndUpdate((req.user as any)._id, {
      ingresoColegio,
      añoIngreso: ingresoColegio,
      ingresoColegioChanged: true
    });
    res.json({ ok: true, ingresoColegio });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.use(requireDb, requireAuth, requireActiveUser, (req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

export default router;
