require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Probando conexión a MongoDB Atlas...');
console.log('📝 MONGODB_URI:', process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definido en .env');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conexión exitosa a MongoDB Atlas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  });
