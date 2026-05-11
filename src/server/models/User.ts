import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  picture: { type: String },
  role: { 
    type: String, 
    enum: ['user', 'moderator', 'admin', 'superadmin'], 
    default: 'user' 
  },
  credits: { type: Number, default: 100 },
  lastDailyCredit: { type: Date, default: Date.now },
  bio: { type: String, default: '¡Orgullosamente COAR!' },
  banned: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
