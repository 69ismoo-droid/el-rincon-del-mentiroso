require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Forzar MONGODB_URI si no está definida
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/?appName=Cluster0';
}

console.log('🧹 Limpiando usuarios con contraseñas corruptas...');

// Esquema simple para limpiar
const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  displayName: String,
  inviteCode: String,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function cleanUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas');
    
    // Obtener todos los usuarios
    const users = await User.find({});
    console.log(`📊 Encontrados ${users.length} usuarios`);
    
    // Eliminar todos los usuarios (limpieza completa)
    const result = await User.deleteMany({});
    console.log(`🗑️ Eliminados ${result.deletedCount} usuarios`);
    
    // Crear admin limpio
    const adminPasswordHash = await bcrypt.hash('123456789', 10);
    const admin = new User({
      email: 'cruel@admin',
      passwordHash: adminPasswordHash,
      displayName: 'Administrador',
      inviteCode: 'admin-2024',
      createdAt: new Date()
    });
    
    await admin.save();
    console.log('👑 Admin creado con contraseña limpia');
    console.log('🔐 Email: cruel@admin');
    console.log('🔐 Password: 123456789');
    
    console.log('✅ Base de datos limpiada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

cleanUsers();
