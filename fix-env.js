const fs = require('fs');

// Leer el archivo .env actual
let envContent = fs.readFileSync('.env', 'utf8');

// Reemplazar <db_password> con la contraseña real
envContent = envContent.replace('<db_password>', '28dejulio');

// Escribir el archivo actualizado
fs.writeFileSync('.env', envContent);

console.log('✅ .env actualizado correctamente');
console.log('🔐 Contraseña de MongoDB agregada');
