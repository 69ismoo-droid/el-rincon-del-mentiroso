import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Autenticación
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return v.endsWith('@cusco.coar.edu.pe');
      },
      message: 'Solo se permiten correos institucionales @cusco.coar.edu.pe'
    }
  },
  password: { type: String, required: true, select: false },
  isVerified: { type: Boolean, default: false },
  otpCode: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  otpFailedAttempts: { type: Number, default: 0, select: false },
  otpResendCount: { type: Number, default: 0, select: false },
  otpResendWindowStart: { type: Date, select: false },
  
  // Perfil
  nombreCompleto: { type: String, required: false, default: 'Pendiente' },
  displayName: { type: String, required: false, default: '' },
  displayNameChanged: { type: Boolean, default: false },
  añoIngreso: { type: Number, required: false, default: new Date().getFullYear() },
  ingresoColegioChanged: { type: Boolean, default: false },
  bio: { type: String, default: '¡Orgullosamente COAR!' },
  
  // Sistema
  role: { 
    type: String, 
    enum: ['user', 'semiadmin', 'admin', 'superadmin'], 
    default: 'user' 
  },
  credits: { type: Number, default: 100 },
  lastDailyCredit: { type: Date, default: Date.now },
  banned: { type: Boolean, default: false },
  
  // Legado (mantener por compatibilidad)
  googleId: { type: String, required: false },
  name: { type: String, required: false },
  ingresoColegio: { type: Number, required: false },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
