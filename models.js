const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Esquema de Usuario
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  inviteCode: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  displayName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Esquema de Noticias
const newsSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 140
  },
  content: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 2000
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Esquema de Adjuntos
const attachmentSchema = new mongoose.Schema({
  newsId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'News' 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  storedName: { 
    type: String, 
    required: true 
  },
  mime: { 
    type: String, 
    required: true 
  },
  size: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Esquema de Foro - Hilos
const threadSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 140
  },
  body: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 2000
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Esquema de Foro - Respuestas
const replySchema = new mongoose.Schema({
  threadId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'Thread' 
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  body: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 2000
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Esquema de Mensajes Privados
const mensajeSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  content: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 1000
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Esquema de Posts (Mentiras del Foro)
const postSchema = new mongoose.Schema({
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'User'
  },
  titulo: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  contenido: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 5000
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  usuario: {
    type: String,
    default: 'Anónimo'
  }
}, {
  timestamps: true
});

// Esquema de Comentarios en Posts
const commentSchema = new mongoose.Schema({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'Post'
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'User'
  },
  content: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 2000
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Exportar modelos
const User = mongoose.model('User', userSchema);
const News = mongoose.model('News', newsSchema);
const Attachment = mongoose.model('Attachment', attachmentSchema);
const Thread = mongoose.model('Thread', threadSchema);
const Reply = mongoose.model('Reply', replySchema);
const Mensaje = mongoose.model('Mensaje', mensajeSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = {
  User,
  News,
  Attachment,
  Thread,
  Reply,
  Mensaje,
  Post,
  Comment,
  mongoose
};
