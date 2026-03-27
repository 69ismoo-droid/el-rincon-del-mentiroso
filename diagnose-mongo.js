const dns = require('dns');
const mongoose = require('mongoose');

console.log('🔍 Diagnóstico completo de conexión MongoDB Atlas...\n');

// 1. Probar resolución DNS
console.log('1️⃣ Probando resolución DNS de MongoDB Atlas...');
dns.resolveSrv('_mongodb._tcp.cluster0.lvswgvg.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('❌ Error DNS:', err.message);
    console.log('🔍 Esto indica que tu red está bloqueando MongoDB Atlas');
    console.log('💡 Solución: Configura la whitelist en MongoDB Atlas o revisa tu firewall');
    process.exit(1);
  } else {
    console.log('✅ DNS resuelto correctamente:');
    addresses.forEach((addr, i) => {
      console.log(`   ${i + 1}. ${addr.name}:${addr.port}`);
    });
    
    // 2. Probar conexión con timeout
    console.log('\n2️⃣ Probando conexión con timeout...');
    const mongoose = require('mongoose');
    
    const connectionPromise = mongoose.connect(
      'mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/?appName=Cluster0',
      {
        serverSelectionTimeoutMS: 5000, // 5 segundos
        connectTimeoutMS: 5000
      }
    );
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de conexión')), 10000);
    });
    
    Promise.race([connectionPromise, timeoutPromise])
      .then(() => {
        console.log('✅ Conexión exitosa a MongoDB Atlas');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error de conexión:', error.message);
        console.log('\n🔍 Posibles soluciones:');
        console.log('   1. Verifica que la whitelist en MongoDB Atlas incluya tu IP');
        console.log('   2. Intenta con "Allow Access from Anywhere"');
        console.log('   3. Revisa tu firewall/antivirus');
        console.log('   4. Prueba desde otra red (móvil con datos)');
        process.exit(1);
      });
  }
});
