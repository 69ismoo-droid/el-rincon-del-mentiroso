require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Revisando todas las bases de datos en el cluster...');

// Conectar sin especificar base de datos para ver todo
const adminConnection = 'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/admin?appName=Cluster0';

async function listAllDatabases() {
  try {
    await mongoose.connect(adminConnection);
    console.log('✅ Conectado a MongoDB Atlas - Revisando todas las bases');
    
    // Usar el driver nativo para listar bases de datos
    const admin = mongoose.connection.db.admin();
    const databases = await admin.listDatabases();
    
    console.log('\n📊 Todas las bases de datos en el cluster:');
    console.log('═'.repeat(50));
    
    for (const db of databases.databases) {
      console.log(`🗄️ ${db.name}`);
      
      // Conectar a cada base para ver sus colecciones
      try {
        const dbConnection = mongoose.connection.useDb(db.name);
        const collections = await dbConnection.db.listCollections().toArray();
        
        if (collections.length > 0) {
          console.log(`   📁 Colecciones (${collections.length}):`);
          for (const collection of collections) {
            console.log(`      📄 ${collection.name}`);
            
            // Contar documentos en colecciones importantes
            if (['users', 'news', 'threads', 'replies'].includes(collection.name)) {
              const count = await dbConnection.db.collection(collection.name).countDocuments();
              console.log(`         📊 ${count} documentos`);
            }
          }
        } else {
          console.log(`   📁 (vacía - sin colecciones)`);
        }
        console.log('');
      } catch (err) {
        console.log(`   ❌ Error al acceder: ${err.message}`);
      }
    }
    
    // Buscar específicamente bases con "test" en el nombre
    console.log('🔍 Bases de datos con "test":');
    const testDbs = databases.databases.filter(db => 
      db.name.toLowerCase().includes('test')
    );
    
    if (testDbs.length > 0) {
      for (const testDb of testDbs) {
        console.log(`⚠️ ${testDb.name}`);
        
        // Ver qué tiene adentro
        try {
          const dbConnection = mongoose.connection.useDb(testDb.name);
          const collections = await dbConnection.db.listCollections().toArray();
          
          for (const collection of collections) {
            const count = await dbConnection.db.collection(collection.name).countDocuments();
            console.log(`   📄 ${collection.name}: ${count} documentos`);
          }
        } catch (err) {
          console.log(`   ❌ Error: ${err.message}`);
        }
      }
    } else {
      console.log('✅ No se encontraron bases de datos con "test"');
    }
    
    console.log('\n✅ Revisión completada');
    
  } catch (error) {
    console.error('❌ Error al listar bases de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}

listAllDatabases();
