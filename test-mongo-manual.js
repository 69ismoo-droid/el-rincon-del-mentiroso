const fs = require('fs');
const path = require('path');

// Forzar carga del .env con codificación UTF-8
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse manual del .env
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Establecer variables de entorno
Object.assign(process.env, envVars);

console.log('✅ Variables de entorno cargadas manualmente');
console.log('🔍 MONGODB_URI:', envVars.MONGODB_URI?.substring(0, 60) + '...');

// Probar conexión
const mongoose = require('mongoose');

mongoose.connect(envVars.MONGODB_URI)
  .then(() => {
    console.log('✅ Conexión exitosa a MongoDB Atlas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  });
