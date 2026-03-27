const https = require('https');
const dns = require('dns');

console.log('🔍 Probando conectividad básica...\n');

// 1. Probar Google (para verificar que tenemos internet)
console.log('1️⃣ Probando conexión a Google...');
https.get('https://www.google.com', (res) => {
  console.log('✅ Conexión a Google exitosa');
  
  // 2. Probar MongoDB Atlas directamente
  console.log('\n2️⃣ Probando conexión directa a MongoDB Atlas...');
  https.get('https://cloud.mongodb.com', (res) => {
    console.log('✅ Conexión a MongoDB Atlas web exitosa');
    
    // 3. Probar DNS de MongoDB
    console.log('\n3️⃣ Probando DNS de MongoDB Atlas...');
    dns.resolve4('cluster0.lvswgvg.mongodb.net', (err, addresses) => {
      if (err) {
        console.error('❌ Error DNS IPv4:', err.message);
      } else {
        console.log('✅ DNS IPv4 resuelto:', addresses);
      }
      
      // 4. Probar SRV (el que falla)
      console.log('\n4️⃣ Probando DNS SRV (el que necesita MongoDB)...');
      dns.resolveSrv('_mongodb._tcp.cluster0.lvswgvg.mongodb.net', (err, addresses) => {
        if (err) {
          console.error('❌ Error DNS SRV:', err.message);
          console.log('\n🔍 Análisis del problema:');
          console.log('   - Puedes navegar a MongoDB Atlas web ✅');
          console.log('   - Puedes resolver DNS básico ✅');
          console.log('   - NO puedes resolver DNS SRV ❌');
          console.log('\n💡 Esto indica que tu ISP/DNS bloquea consultas SRV');
          console.log('🔧 Solución: Cambiar DNS o usar VPN');
        } else {
          console.log('✅ DNS SRV resuelto:', addresses);
        }
      });
    });
  }).on('error', (err) => {
    console.error('❌ Error conexión MongoDB Atlas web:', err.message);
  });
}).on('error', (err) => {
  console.error('❌ Error conexión Google:', err.message);
  console.log('🔍 No tienes conexión a internet');
});
