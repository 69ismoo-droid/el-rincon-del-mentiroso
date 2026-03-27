require('dotenv').config();
const dns = require('dns');

console.log('🔍 Probando DNS con nuevo servidor...\n');

// Probar SRV de MongoDB Atlas
dns.resolveSrv('_mongodb._tcp.cluster0.lvswgvg.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('❌ Aún falla DNS SRV:', err.message);
    console.log('🔄 Intenta con otro DNS (Cloudflare: 1.1.1.1)');
  } else {
    console.log('✅ DNS SRV funcionando!');
    console.log('📍 Servidores encontrados:');
    addresses.forEach((addr, i) => {
      console.log(`   ${i + 1}. ${addr.name}:${addr.port}`);
    });
    
    // Probar conexión MongoDB
    const mongoose = require('mongoose');
    mongoose.connect('mongodb+srv://admin_cruel:28dejulio@cluster0.lvswgvg.mongodb.net/?appName=Cluster0')
      .then(() => {
        console.log('\n🎉 Conexión exitosa a MongoDB Atlas!');
        console.log('✅ El cambio de DNS funcionó');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Error de conexión:', error.message);
        process.exit(1);
      });
  }
});
