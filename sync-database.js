// Script para agregar al server.js - Sincronización automática al iniciar
// Agregar esto después de la conexión a MongoDB

async function syncDatabase() {
  try {
    console.log('🔄 Iniciando sincronización de base de datos...');
    
    const { User, News, Thread, Reply } = require('./models');
    
    // 1. Verificar admin
    const adminExists = await User.findOne({ email: 'cruel@admin' });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const adminPasswordHash = await bcrypt.hash('123456789', 10);
      const admin = new User({
        email: 'cruel@admin',
        passwordHash: adminPasswordHash,
        displayName: 'Administrador',
        inviteCode: 'admin-2024',
        createdAt: new Date()
      });
      await admin.save();
      console.log('👑 Admin creado automáticamente');
    }
    
    // 2. Limpiar datos huérfanos
    const newsCount = await News.countDocuments();
    const threadCount = await Thread.countDocuments();
    const replyCount = await Reply.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`📊 Base de datos sincronizada:`);
    console.log(`👥 Usuarios: ${userCount}`);
    console.log(`📰 Noticias: ${newsCount}`);
    console.log(`💬 Hilos: ${threadCount}`);
    console.log(`💭 Respuestas: ${replyCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return false;
  }
}

module.exports = { syncDatabase };
