const { mongoose } = require('./models');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/el-rincon-del-mentiroso';
      
      await mongoose.connect(mongoUri);
      
      this.isConnected = true;
      console.log('🗄️ Connected to MongoDB successfully');
      console.log('📍 Database:', mongoUri.includes('localhost') ? 'Local' : 'MongoDB Atlas');
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  // Métodos de Usuarios
  async createUser(userData) {
    const { User } = require('./models');
    const user = new User(userData);
    return await user.save();
  }

  async getUserByEmail(email) {
    const { User } = require('./models');
    return await User.findOne({ email: email.toLowerCase() });
  }

  async getUserById(id) {
    const { User } = require('./models');
    return await User.findById(id);
  }

  async updateUserPassword(id, newPasswordHash) {
    const { User } = require('./models');
    return await User.findByIdAndUpdate(id, { passwordHash: newPasswordHash });
  }

  async getAllUsers() {
    const { User } = require('./models');
    return await User.find({}).sort({ createdAt: -1 });
  }

  // Métodos de Noticias
  async createNews(newsData) {
    const { News } = require('./models');
    const news = new News(newsData);
    return await news.save();
  }

  async getAllNews() {
    const { News } = require('./models');
    return await News.find({}).sort({ createdAt: -1 });
  }

  async getNewsById(id) {
    const { News } = require('./models');
    return await News.findById(id);
  }

  async deleteNews(id) {
    const { News } = require('./models');
    return await News.findByIdAndDelete(id);
  }

  // Métodos de Adjuntos
  async createAttachment(attachmentData) {
    const { Attachment } = require('./models');
    const attachment = new Attachment(attachmentData);
    return await attachment.save();
  }

  async getAttachmentsByNewsId(newsId) {
    const { Attachment } = require('./models');
    return await Attachment.find({ newsId }).sort({ createdAt: 1 });
  }

  async deleteOldAttachments(cutoffDate) {
    const { Attachment } = require('./models');
    const result = await Attachment.deleteMany({ 
      createdAt: { $lt: cutoffDate } 
    });
    return { changes: result.deletedCount };
  }

  // Métodos de Foro - Hilos
  async createThread(threadData) {
    const { Thread } = require('./models');
    const thread = new Thread(threadData);
    return await thread.save();
  }

  async getAllThreads() {
    const { Thread } = require('./models');
    return await Thread.find({}).sort({ createdAt: -1 });
  }

  async getThreadById(id) {
    const { Thread } = require('./models');
    return await Thread.findById(id);
  }

  async deleteThread(id) {
    const { Thread } = require('./models');
    return await Thread.findByIdAndDelete(id);
  }

  // Métodos de Foro - Respuestas
  async createReply(replyData) {
    const { Reply } = require('./models');
    const reply = new Reply(replyData);
    return await reply.save();
  }

  async getRepliesByThreadId(threadId) {
    const { Reply } = require('./models');
    return await Reply.find({ threadId }).sort({ createdAt: 1 });
  }

  async getReplyById(id) {
    const { Reply } = require('./models');
    return await Reply.findById(id);
  }

  async deleteReply(id) {
    const { Reply } = require('./models');
    return await Reply.findByIdAndDelete(id);
  }

  async deleteOldThreads(cutoffDate) {
    const { Thread } = require('./models');
    const result = await Thread.deleteMany({ 
      createdAt: { $lt: cutoffDate } 
    });
    return { changes: result.deletedCount };
  }

  async deleteOldReplies(cutoffDate) {
    const { Reply } = require('./models');
    const result = await Reply.deleteMany({ 
      createdAt: { $lt: cutoffDate } 
    });
    return { changes: result.deletedCount };
  }

  // Métodos de Mensajes Privados
  async createMensaje(mensajeData) {
    const { Mensaje } = require('./models');
    const mensaje = new Mensaje(mensajeData);
    return await mensaje.save();
  }

  async getMensajesByUserId(userId) {
    const { Mensaje } = require('./models');
    return await Mensaje.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ createdAt: -1 });
  }

  async getMensajesEntreUsuarios(userId1, userId2) {
    const { Mensaje } = require('./models');
    return await Mensaje.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ createdAt: 1 });
  }

  async markMensajeAsRead(mensajeId, userId) {
    const { Mensaje } = require('./models');
    return await Mensaje.findOneAndUpdate(
      { _id: mensajeId, receiverId: userId },
      { read: true },
      { new: true }
    );
  }

  async getUnreadCount(userId) {
    const { Mensaje } = require('./models');
    return await Mensaje.countDocuments({
      receiverId: userId,
      read: false
    });
  }

  async deleteOldMensajes(cutoffDate) {
    const { Mensaje } = require('./models');
    const result = await Mensaje.deleteMany({ 
      createdAt: { $lt: cutoffDate } 
    });
    return { changes: result.deletedCount };
  }

  async getMensajeById(mensajeId) {
    const { Mensaje } = require('./models');
    return await Mensaje.findById(mensajeId);
  }

  // ============================================
  // MÉTODOS DEL FORO DE POSTS (MENTIRAS)
  // ============================================

  async createPost(postData) {
    const { Post } = require('./models');
    const post = new Post(postData);
    return await post.save();
  }

  async getAllPosts() {
    const { Post } = require('./models');
    return await Post.find().sort({ createdAt: -1 });
  }

  async getPostById(postId) {
    const { Post } = require('./models');
    return await Post.findById(postId);
  }

  async createComment(commentData) {
    const { Comment } = require('./models');
    const comment = new Comment(commentData);
    return await comment.save();
  }

  async getCommentsByPostId(postId) {
    const { Comment } = require('./models');
    return await Comment.find({ postId }).sort({ createdAt: 1 });
  }
}

module.exports = new Database();
