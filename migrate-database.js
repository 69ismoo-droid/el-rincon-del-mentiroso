require('dotenv').config();
const mongoose = require('mongoose');

// Forzar MONGODB_URI si no está definida
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/?appName=Cluster0';
}

console.log('🔄 Iniciando migración de bases de datos...');

// Esquema simple para migración
const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  displayName: String,
  inviteCode: String,
  createdAt: Date
}, { collection: 'users' });

const newsSchema = new mongoose.Schema({
  title: String,
  content: String,
  authorId: mongoose.Schema.Types.ObjectId,
  createdAt: Date
}, { collection: 'news' });

const threadSchema = new mongoose.Schema({
  title: String,
  body: String,
  authorId: mongoose.Schema.Types.ObjectId,
  createdAt: Date
}, { collection: 'threads' });

const replySchema = new mongoose.Schema({
  threadId: mongoose.Schema.Types.ObjectId,
  authorId: mongoose.Schema.Types.ObjectId,
  body: String,
  createdAt: Date
}, { collection: 'replies' });

const User = mongoose.model('User', userSchema);
const News = mongoose.model('News', newsSchema);
const Thread = mongoose.model('Thread', threadSchema);
const Reply = mongoose.model('Reply', replySchema);

async function migrateDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas');

    // 1. Limpiar datos duplicados o inconsistentes
    console.log('🧹 Limpiando datos inconsistentes...');
    
    // Limpiar usuarios duplicados por email
    const duplicateUsers = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    for (const dup of duplicateUsers) {
      console.log(`🔍 Encontrados ${dup.count} usuarios con email: ${dup._id}`);
      // Mantener el más reciente, eliminar los demás
      const users = await User.find({ email: dup._id }).sort({ createdAt: -1 });
      const toKeep = users[0];
      const toDelete = users.slice(1);
      
      for (const user of toDelete) {
        await User.findByIdAndDelete(user._id);
        console.log(`🗑️ Eliminado usuario duplicado: ${user.email}`);
      }
    }

    // 2. Verificar y corregir referencias rotas
    console.log('🔧 Verificando referencias...');
    
    // Verificar que todos los authorId existan
    const allNews = await News.find({});
    for (const news of allNews) {
      const author = await User.findById(news.authorId);
      if (!author) {
        console.log(`⚠️ Noticia ${news._id} tiene autor inválido, eliminando...`);
        await News.findByIdAndDelete(news._id);
      }
    }

    const allThreads = await Thread.find({});
    for (const thread of allThreads) {
      const author = await User.findById(thread.authorId);
      if (!author) {
        console.log(`⚠️ Hilo ${thread._id} tiene autor inválido, eliminando...`);
        await Thread.findByIdAndDelete(thread._id);
      }
    }

    const allReplies = await Reply.find({});
    for (const reply of allReplies) {
      const author = await User.findById(reply.authorId);
      const thread = await Thread.findById(reply.threadId);
      if (!author || !thread) {
        console.log(`⚠️ Respuesta ${reply._id} tiene referencias inválidas, eliminando...`);
        await Reply.findByIdAndDelete(reply._id);
      }
    }

    // 3. Crear admin si no existe
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
      console.log('👑 Admin creado exitosamente');
    }

    // 4. Estadísticas finales
    const userCount = await User.countDocuments();
    const newsCount = await News.countDocuments();
    const threadCount = await Thread.countDocuments();
    const replyCount = await Reply.countDocuments();

    console.log('\n📊 Estadísticas finales:');
    console.log(`👥 Usuarios: ${userCount}`);
    console.log(`📰 Noticias: ${newsCount}`);
    console.log(`💬 Hilos: ${threadCount}`);
    console.log(`💭 Respuestas: ${replyCount}`);
    console.log('\n✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}

migrateDatabase();
