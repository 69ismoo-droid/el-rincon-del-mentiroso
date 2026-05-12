import express from 'express';
import { User } from '../models/User.js';
import { Post, Comment } from '../models/Forum.js';
import { TeacherRating, Bet, LostItem, News } from '../models/Community.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'No autorizado' });
};

// --- FORUM ROUTES ---
router.get('/posts', isAuthenticated, async (req, res) => {
  try {
    const { q, author, category, startDate, endDate } = req.query;
    let filter: any = {};

    if (q) {
      filter.$or = [
        { title: { $regex: String(q), $options: 'i' } },
        { content: { $regex: String(q), $options: 'i' } }
      ];
    }

    if (author) {
      const user = await User.findOne({ name: { $regex: String(author), $options: "i" } } as any);
      if (user) filter.author = user._id;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const posts = await Post.find(filter).populate('author', 'name picture role').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/posts', isAuthenticated, async (req: any, res) => {
  try {
    const post = await Post.create({ ...req.body, author: req.user._id });
    // Add activity points
    req.user.credits += 5;
    await req.user.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/posts/:id', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name picture role');
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    post.views += 1;
    await post.save();
    const comments = await Comment.find({ post: post._id }).populate('author', 'name picture role').sort({ createdAt: 1 });
    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/posts/:id/comments', isAuthenticated, async (req: any, res) => {
  try {
    const comment = await Comment.create({
      content: req.body.content,
      author: req.user._id,
      post: req.params.id
    });

    const post = await Post.findById(req.params.id);
    if (post && post.author.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        content: `${req.user.name} comentó en tu publicación: "${post.title}"`
      });

      const recipientSocket = req.userSockets.get(post.author.toString());
      if (recipientSocket) {
        req.io.to(recipientSocket).emit('notification', notif);
      }
    }

    // Mentions logic
    const mentions = req.body.content.match(/@(\w+)/g);
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.slice(1);
        const mentionedUser = await User.findOne({ name: { $regex: new RegExp('^' + username + '$', 'i') } });
        if (mentionedUser && mentionedUser._id.toString() !== req.user._id.toString()) {
          const mNotif = await Notification.create({
            recipient: mentionedUser._id,
            sender: req.user._id,
            type: 'mention',
            post: post?._id,
            content: `${req.user.name} te mencionó en un comentario.`
          });
          const mSocket = req.userSockets.get(mentionedUser._id.toString());
          if (mSocket) {
            req.io.to(mSocket).emit('notification', mNotif);
          }
        }
      }
    }

    req.user.credits += 2;
    await req.user.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- MESSAGING ---
router.get('/messages', isAuthenticated, async (req: any, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    }).populate('sender recipient', 'name picture').sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/messages', isAuthenticated, async (req: any, res) => {
  try {
    const msg = await Message.create({
      ...req.body,
      sender: req.user._id
    });

    if (req.body.recipient !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: req.body.recipient,
        sender: req.user._id,
        type: 'message',
        content: `${req.user.name} te envió un mensaje privado.`
      });

      const recipientSocket = req.userSockets.get(req.body.recipient);
      if (recipientSocket) {
        req.io.to(recipientSocket).emit('notification', notif);
      }
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- NOTIFICATIONS ---
router.get('/notifications', isAuthenticated, async (req: any, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name picture')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/notifications/read', isAuthenticated, async (req: any, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- COMMUNITY FEATURES ---
router.get('/teacher-ratings', isAuthenticated, async (req, res) => {
  const ratings = await TeacherRating.find().sort({ rating: -1 });
  res.json(ratings);
});

router.get('/news', isAuthenticated, async (req, res) => {
  const news = await News.find().populate('author', 'name').sort({ createdAt: -1 });
  res.json(news);
});

router.get('/lost-found', isAuthenticated, async (req, res) => {
  const items = await LostItem.find().populate('founder', 'name').sort({ createdAt: -1 });
  res.json(items);
});

export default router;
