import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: String, 
    enum: ['General', 'Matemática (Bachillerato)', 'Literatura', 'Vida Escolar', 'Consejos ExCOAR'], 
    default: 'General' 
  },
  views: { type: Number, default: 0 },
  pinned: { type: Boolean, default: false }
}, { timestamps: true });

export const Post = mongoose.model('Post', PostSchema);
export const Comment = mongoose.model('Comment', CommentSchema);
