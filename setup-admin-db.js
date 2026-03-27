require('dotenv').config();
const mongoose = require('mongoose');

// Forzar MONGODB_URI a la base de datos correcta
process.env.MONGODB_URI = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/admin?appName=Cluster0';

console.log('🧹 Limpiando y configurando base de datos admin...');

// Importar modelos correctos
const { User, News, Thread, Reply } = require('./models');

async function setupAdminDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a base de datos admin');

    // 1. Eliminar todos los datos existentes para empezar limpio
    console.log('🗑️ Eliminando datos existentes...');
    await User.deleteMany({});
    await News.deleteMany({});
    await Thread.deleteMany({});
    await Reply.deleteMany({});
    console.log('✅ Base de datos limpiada');

    // 2. Crear usuario admin
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
    console.log('👑 Admin creado: cruel@admin / 123456789');

    // 3. Verificar estado final
    const userCount = await User.countDocuments();
    const newsCount = await News.countDocuments();
    const threadCount = await Thread.countDocuments();
    const replyCount = await Reply.countDocuments();

    console.log('\n📊 Estado final de la base de datos admin:');
    console.log(`👥 Usuarios: ${userCount}`);
    console.log(`📰 Noticias: ${newsCount}`);
    console.log(`💬 Hilos: ${threadCount}`);
    console.log(`💭 Respuestas: ${replyCount}`);

    console.log('\n✅ Base de datos admin configurada correctamente');
    console.log('🔗 Ahora la aplicación usará solo esta base de datos');

  } catch (error) {
    console.error('❌ Error en configuración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}

setupAdminDatabase();
