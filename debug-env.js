const fs = require('fs');
const path = require('path');

// Leer y mostrar el contenido exacto del archivo .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('📄 Contenido exacto de .env:');
console.log('----------------------------------------');
console.log(envContent);
console.log('----------------------------------------');

// Mostrar cada línea con su índice
const lines = envContent.split('\n');
console.log('📋 Líneas del archivo:');
lines.forEach((line, index) => {
  console.log(`${index}: "${line}"`);
});
