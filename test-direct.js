require('dotenv').config();

// Probar con URL directa sin SRV
const directUri = "mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/?appName=Cluster0";

console.log('🔍 Probando conexión directa a MongoDB Atlas...');
console.log('📝 URI:', directUri);

const mongoose = require('mongoose');

mongoose.connect(directUri)
  .then(() => {
    console.log('✅ Conexión exitosa a MongoDB Atlas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error de conexión:', error.message);
    console.log('🔍 Verifica:');
    console.log('   1. Que tu IP está en la whitelist de MongoDB Atlas');
    console.log('   2. Que el usuario admin_cruel tiene permisos');
    console.log('   3. Que no haya firewall bloqueando la conexión');
    process.exit(1);
  });
