require('dotenv').config();
const mongoose = require('mongoose');

// Nueva base de datos dedicada para nuestra aplicación
const dedicatedDB = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/el-rincon-del-mentiroso?appName=Cluster0';

console.log('🏗️ Creando base de datos dedicada: el-rincon-del-mentiroso');

// Importar modelos
const { User, News, Thread, Reply } = require('./models');

async function createDedicatedDatabase() {
  try {
    await mongoose.connect(dedicatedDB);
    console.log('✅ Conectado a base de datos dedicada');

    // 1. Limpiar cualquier dato existente (empezar fresco)
    console.log('🧹 Limpiando base de datos dedicada...');
    await User.deleteMany({});
    await News.deleteMany({});
    await Thread.deleteMany({});
    await Reply.deleteMany({});

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
    console.log('👑 Admin creado en base dedicada');

    // 3. Crear algunos usuarios de ejemplo para COAR
    const sampleUsers = [
      {
        email: 'estudiante@cusco.coar.edu.pe',
        passwordHash: await bcrypt.hash('password123', 10),
        displayName: 'Estudiante COAR',
        inviteCode: 'coar-2024-1',
        createdAt: new Date()
      },
      {
        email: 'profesor@cusco.coar.edu.pe',
        passwordHash: await bcrypt.hash('password123', 10),
        displayName: 'Profesor COAR',
        inviteCode: 'coar-2024-2',
        createdAt: new Date()
      }
    ];

    for (const user of sampleUsers) {
      await User.create(user);
      console.log(`👤 Usuario creado: ${user.email}`);
    }

    // 4. Verificar estado final
    const userCount = await User.countDocuments();
    const newsCount = await News.countDocuments();
    const threadCount = await Thread.countDocuments();
    const replyCount = await Reply.countDocuments();

    console.log('\n📊 Base de datos dedicada lista:');
    console.log(`🗄️ Base de datos: el-rincon-del-mentiroso`);
    console.log(`👥 Usuarios: ${userCount}`);
    console.log(`📰 Noticias: ${newsCount}`);
    console.log(`💬 Hilos: ${threadCount}`);
    console.log(`💭 Respuestas: ${replyCount}`);

    console.log('\n✅ Base de datos dedicada creada exitosamente');
    console.log('🔗 URL: mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/el-rincon-del-mentiroso');

  } catch (error) {
    console.error('❌ Error creando base dedicada:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}

createDedicatedDatabase();
