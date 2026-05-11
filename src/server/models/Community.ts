import mongoose from 'mongoose';

// Ranking de Profesores
const TeacherRatingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    comment: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Apuestas de Créditos (Skins/Predicciones)
const BetSchema = new mongoose.Schema({
  event: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  options: [{ name: String, pool: { type: Number, default: 0 } }],
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    option: String,
    amount: Number
  }],
  status: { type: String, enum: ['open', 'closed', 'resolved'], default: 'open' },
  winner: String
}, { timestamps: true });

// Objetos Perdidos
const LostItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String },
  founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['lost', 'found', 'claimed'], default: 'lost' }
}, { timestamps: true });

// Noticias / Diario Mural
const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: { type: String },
  category: { type: String, enum: ['ACADEMICO', 'MINEDU', 'RESIDENCIA', 'COMEDOR', 'EVENTOS'], default: 'ACADEMICO' }
}, { timestamps: true });

export const TeacherRating = mongoose.model('TeacherRating', TeacherRatingSchema);
export const Bet = mongoose.model('Bet', BetSchema);
export const LostItem = mongoose.model('LostItem', LostItemSchema);
export const News = mongoose.model('News', NewsSchema);
