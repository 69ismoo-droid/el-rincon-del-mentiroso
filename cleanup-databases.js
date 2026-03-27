require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧹 Script para limpiar bases de datos no deseadas...');

// Conectar a base de datos principal
const mainDB = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/el-rincon-del-mentiroso?appName=Cluster0';

async function cleanupUnwantedDatabases() {
  try {
    await mongoose.connect(mainDB);
    console.log('✅ Conectado a base de datos principal');
    
    // Usar el driver nativo para administrar
    const admin = mongoose.connection.db.admin();
    
    // Lista de bases que queremos mantener
    const keepDatabases = [
      'admin',
      'local', 
      'config',
      'el-rincon-del-mentiroso'
    ];
    
    // Obtener todas las bases
    const databases = await admin.listDatabases();
    console.log('\n📊 Bases de datos encontradas:');
    
    for (const db of databases.databases) {
      console.log(`🗄️ ${db.name}`);
      
      if (keepDatabases.includes(db.name)) {
        console.log(`   ✅ Mantener - Base necesaria`);
        continue;
      }
      
      // Preguntar si contiene datos importantes
      try {
        const dbConnection = mongoose.connection.useDb(db.name);
        const collections = await dbConnection.db.listCollections().toArray();
        
        if (collections.length > 0) {
          console.log(`   ⚠️ Tiene ${collections.length} colecciones`);
          
          // Ver si tiene usuarios o datos importantes
          const hasUsers = collections.some(c => c.name === 'users');
          const hasNews = collections.some(c => c.name === 'news');
          const hasThreads = collections.some(c => c.name === 'threads');
          
          if (hasUsers || hasNews || hasThreads) {
            console.log(`   🔍 Contiene datos importantes (users/news/threads)`);
            console.log(`   💡 RECOMENDACIÓN: Migrar datos antes de eliminar`);
            console.log(`   📝 Ejecuta: node migrate-to-dedicated.js`);
          } else {
            console.log(`   📄 Solo datos de prueba o sistema`);
            console.log(`   🗑️ Se puede eliminar safely`);
          }
        } else {
          console.log(`   📁 Vacía - se puede eliminar`);
        }
        
        // Si es una base de test, marcar para eliminación
        if (db.name.toLowerCase().includes('test')) {
          console.log(`   🧪 Base de pruebas - marcar para eliminación`);
        }
        
      } catch (err) {
        console.log(`   ❌ Error al revisar: ${err.message}`);
      }
      
      console.log('');
    }
    
    console.log('\n📋 Resumen:');
    console.log('✅ Bases a mantener: admin, local, config, el-rincon-del-mentiroso');
    console.log('⚠️ Revisar manualmente en MongoDB Atlas las bases con "test"');
    console.log('🔗 URL: https://cloud.mongodb.com/');
    
    console.log('\n💡 Para eliminar bases no deseadas:');
    console.log('1. Entra a MongoDB Atlas');
    console.log('2. Ve a tu cluster');
    console.log('3. Haz clic en "Collections"');
    console.log('4. Selecciona la base de datos no deseada');
    console.log('5. Haz clic en "Drop Database"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}

cleanupUnwantedDatabases();
