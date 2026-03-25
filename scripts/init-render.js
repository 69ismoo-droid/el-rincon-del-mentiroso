// Script de inicialización para Render
// Se ejecuta automáticamente antes de iniciar el servidor

const fs = require('fs');
const path = require('path');

// Crear directorios necesarios en Render
const dirs = ['/tmp', '/tmp/uploads'];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

console.log('Render initialization completed');
