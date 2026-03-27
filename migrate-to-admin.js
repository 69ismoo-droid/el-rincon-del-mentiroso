require('dotenv').config();
const mongoose = require('mongoose');

// Connection strings
const adminDB = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/admin?appName=Cluster0';
const sampleDB = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/localsample_mflix?appName=Cluster0';

console.log('🔄 Migrando datos de localsample_mflix a admin...');

// Esquemas para nuestra aplicación
const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  displayName: String,
  inviteCode: String,
  createdAt: Date
});

const newsSchema = new mongoose.Schema({
  title: String,
  content: String,
  authorId: mongoose.Schema.Types.ObjectId,
  createdAt: Date
});

const threadSchema = new mongoose.Schema({
  title: String,
  body: String,
  authorId: mongoose.Schema.Types.ObjectId,
  createdAt: Date
});

const replySchema = new mongoose.Schema({
  threadId: mongoose.Schema.Types.ObjectId,
  authorId: mongoose.Schema.Types.ObjectId,
  body: String,
  createdAt: Date
});

async function migrateFromSampleToAdmin() {
  try {
    // Conectar a la base de datos de muestra
    await mongoose.connect(sampleDB);
    console.log('✅ Conectado a localsample_mflix');

    // Crear modelos en la base de muestra
    const SampleUser = mongoose.connection.useDb('localsample_mflix').model('User', userSchema);
    const SampleNews = mongoose.connection.useDb('localsample_mflix').model('News', newsSchema);
    const SampleThread = mongoose.connection.useDb('localsample_mflix').model('Thread', threadSchema);
    const SampleReply = mongoose.connection.useDb('localsample_mflix').model('Reply', replySchema);

    // Obtener todos los datos
    const users = await SampleUser.find({}).lean();
    const news = await SampleNews.find({}).lean();
    const threads = await SampleThread.find({}).lean();
    const replies = await SampleReply.find({}).lean();

    console.log(`📊 Datos encontrados en localsample_mflix:`);
    console.log(`👥 Usuarios: ${users.length}`);
    console.log(`📰 Noticias: ${news.length}`);
    console.log(`💬 Hilos: ${threads.length}`);
    console.log(`💭 Respuestas: ${replies.length}`);

    // Desconectar de la base de muestra
    await mongoose.disconnect();

    // Conectar a la base de admin
    await mongoose.connect(adminDB);
    console.log('✅ Conectado a admin');

    // Crear modelos en la base de admin
    const AdminUser = mongoose.connection.useDb('admin').model('User', userSchema);
    const AdminNews = mongoose.connection.useDb('admin').model('News', newsSchema);
    const AdminThread = mongoose.connection.useDb('admin').model('Thread', threadSchema);
    const AdminReply = mongoose.connection.useDb('admin').model('Reply', replySchema);

    // Migrar usuarios
    for (const user of users) {
      const existingUser = await AdminUser.findOne({ email: user.email });
      if (!existingUser) {
        await AdminUser.create(user);
        console.log(`👤 Migrado usuario: ${user.email}`);
      }
    }

    // Migrar noticias
    for (const item of news) {
      await AdminNews.create(item);
      console.log(`📰 Migrada noticia: ${item.title}`);
    }

    // Migrar hilos
    for (const thread of threads) {
      await AdminThread.create(thread);
      console.log(`💬 Migrado hilo: ${thread.title}`);
    }

    // Migrar respuestas
    for (const reply of replies) {
      await AdminReply.create(reply);
      console.log(`💭 Migrada respuesta`);
    }

    // Verificar resultados
    const finalUsers = await AdminUser.countDocuments();
    const finalNews = await AdminNews.countDocuments();
    const finalThreads = await AdminThread.countDocuments();
    const finalReplies = await AdminReply.countDocuments();

    console.log('\n📊 Estadísticas finales en admin:');
    console.log(`👥 Usuarios: ${finalUsers}`);
    console.log(`📰 Noticias: ${finalNews}`);
    console.log(`💬 Hilos: ${finalThreads}`);
    console.log(`💭 Respuestas: ${finalReplies}`);

    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}

migrateFromSampleToAdmin();
