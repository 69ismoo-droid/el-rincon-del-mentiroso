require('dotenv').config();
const mongoose = require('mongoose');

// URLs de las bases de datos
const adminDB = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/admin?appName=Cluster0';
const sampleDB = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/localsample_mflix?appName=Cluster0';
const dedicatedDB = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/el-rincon-del-mentiroso?appName=Cluster0';

console.log('🔄 Migrando usuarios a base de datos dedicada...');

// Esquema de usuario
const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  displayName: String,
  inviteCode: String,
  createdAt: Date
});

async function migrateToDedicated() {
  try {
    // Recolectar todos los usuarios de ambas bases
    let allUsers = [];

    // 1. Usuarios de admin
    await mongoose.connect(adminDB);
    const AdminUser = mongoose.connection.useDb('admin').model('User', userSchema);
    const adminUsers = await AdminUser.find({}).lean();
    allUsers.push(...adminUsers);
    console.log(`📊 Encontrados ${adminUsers.length} usuarios en admin`);
    await mongoose.disconnect();

    // 2. Usuarios de localsample_mflix
    await mongoose.connect(sampleDB);
    const SampleUser = mongoose.connection.useDb('localsample_mflix').model('User', userSchema);
    const sampleUsers = await SampleUser.find({}).lean();
    allUsers.push(...sampleUsers);
    console.log(`📊 Encontrados ${sampleUsers.length} usuarios en localsample_mflix`);
    await mongoose.disconnect();

    // 3. Eliminar duplicados por email
    const uniqueUsers = [];
    const seenEmails = new Set();
    
    for (const user of allUsers) {
      if (!seenEmails.has(user.email)) {
        seenEmails.add(user.email);
        uniqueUsers.push(user);
      }
    }
    console.log(`📊 Después de eliminar duplicados: ${uniqueUsers.length} usuarios únicos`);

    // 4. Conectar a base dedicada y migrar
    await mongoose.connect(dedicatedDB);
    const DedicatedUser = mongoose.connection.useDb('el-rincon-del-mentiroso').model('User', userSchema);

    // Limpiar base dedicada primero
    await DedicatedUser.deleteMany({});
    console.log('🧹 Base dedicada limpiada');

    // Migrar usuarios únicos
    for (const user of uniqueUsers) {
      await DedicatedUser.create(user);
      console.log(`👤 Migrado: ${user.email}`);
    }

    // 5. Verificar resultado
    const finalCount = await DedicatedUser.countDocuments();
    console.log(`\n✅ Migración completada: ${finalCount} usuarios en base dedicada`);

    // 6. Mostrar usuarios para verificación
    const finalUsers = await DedicatedUser.find({}, { email: 1, displayName: 1, inviteCode: 1 });
    console.log('\n📋 Usuarios en base dedicada:');
    finalUsers.forEach(user => {
      console.log(`  👤 ${user.email} - ${user.displayName} (${user.inviteCode})`);
    });

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}

migrateToDedicated();
