// Diagnóstico Simple del Sistema de Mensajes
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico Simple del Sistema de Mensajes');
console.log('═'.repeat(50));

// 1. Verificar archivos críticos
console.log('\n1️⃣ Archivos Críticos:');
const criticalFiles = [
  'server.js',
  'public/messages.html',
  'public/messages.js',
  'public/messages.css',
  'models.js',
  'database-mongo.js'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar dependencias en package.json
console.log('\n2️⃣ Dependencias en package.json:');
try {
  const packageJson = require('./package.json');
  const requiredDeps = ['socket.io', 'express', 'mongoose'];
  
  requiredDeps.forEach(dep => {
    const installed = packageJson.dependencies[dep];
    console.log(`${installed ? '✅' : '❌'} ${dep}: ${installed || 'NO INSTALADA'}`);
  });
} catch (err) {
  console.log('❌ Error leyendo package.json');
}

// 3. Verificar configuración de mensajes en server.js
console.log('\n3️⃣ Configuración de WebSocket en server.js:');
try {
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  
  const hasSocketIo = serverContent.includes('socket.io');
  const hasWebSocket = serverContent.includes('startWebSocket');
  const hasMessageRoutes = serverContent.includes('/api/mensajes');
  const hasMessageSchema = serverContent.includes('Mensaje');
  
  console.log(`${hasSocketIo ? '✅' : '❌'} socket.io importado`);
  console.log(`${hasWebSocket ? '✅' : '❌'} startWebSocket() implementado`);
  console.log(`${hasMessageRoutes ? '✅' : '❌'} /api/mensajes rutas`);
  console.log(`${hasMessageSchema ? '✅' : '❌'} Mensaje schema`);
  
} catch (err) {
  console.log('❌ Error leyendo server.js');
}

// 4. Verificar models.js
console.log('\n4️⃣ Configuración de Mensaje en models.js:');
try {
  const modelsContent = fs.readFileSync(path.join(__dirname, 'models.js'), 'utf8');
  
  const hasMensajeSchema = modelsContent.includes('mensajeSchema');
  const hasMensajeModel = modelsContent.includes('Mensaje = mongoose.model');
  const hasMensajeExport = modelsContent.includes('Mensaje,');
  
  console.log(`${hasMensajeSchema ? '✅' : '❌'} mensajeSchema definido`);
  console.log(`${hasMensajeModel ? '✅' : '❌'} Mensaje model creado`);
  console.log(`${hasMensajeExport ? '✅' : '❌'} Mensaje exportado`);
  
} catch (err) {
  console.log('❌ Error leyendo models.js');
}

// 5. Verificar database-mongo.js
console.log('\n5️⃣ Métodos de mensajes en database-mongo.js:');
try {
  const dbContent = fs.readFileSync(path.join(__dirname, 'database-mongo.js'), 'utf8');
  
  const hasCreateMensaje = dbContent.includes('createMensaje');
  const hasGetMensajes = dbContent.includes('getMensajesByUserId');
  const hasMarkAsRead = dbContent.includes('markMensajeAsRead');
  const hasGetMensajeById = dbContent.includes('getMensajeById');
  
  console.log(`${hasCreateMensaje ? '✅' : '❌'} createMensaje()`);
  console.log(`${hasGetMensajes ? '✅' : '❌'} getMensajesByUserId()`);
  console.log(`${hasMarkAsRead ? '✅' : '❌'} markMensajeAsRead()`);
  console.log(`${hasGetMensajeById ? '✅' : '❌'} getMensajeById()`);
  
} catch (err) {
  console.log('❌ Error leyendo database-mongo.js');
}

// 6. Verificar frontend messages.js
console.log('\n6️⃣ Configuración de frontend messages.js:');
try {
  const messagesContent = fs.readFileSync(path.join(__dirname, 'public/messages.js'), 'utf8');
  
  const hasSocketConnection = messagesContent.includes('io(');
  const hasTokenAuth = messagesContent.includes('token');
  const hasSendMessage = messagesContent.includes('send_message');
  const hasNewMessage = messagesContent.includes('new_message');
  
  console.log(`${hasSocketConnection ? '✅' : '❌'} Conexión Socket.IO`);
  console.log(`${hasTokenAuth ? '✅' : '❌'} Autenticación con token`);
  console.log(`${hasSendMessage ? '✅' : '❌'} Evento send_message`);
  console.log(`${hasNewMessage ? '✅' : '❌'} Evento new_message`);
  
} catch (err) {
  console.log('❌ Error leyendo messages.js');
}

// 7. Verificar HTML de mensajes
console.log('\n7️⃣ Configuración de messages.html:');
try {
  const htmlContent = fs.readFileSync(path.join(__dirname, 'public/messages.html'), 'utf8');
  
  const hasSocketScript = htmlContent.includes('socket.io/socket.io.js');
  const hasMessagesScript = htmlContent.includes('messages.js');
  const hasMessagesCss = htmlContent.includes('messages.css');
  const hasFormElement = htmlContent.includes('id="messageForm"');
  
  console.log(`${hasSocketScript ? '✅' : '❌'} socket.io/socket.io.js script`);
  console.log(`${hasMessagesScript ? '✅' : '❌'} messages.js script`);
  console.log(`${hasMessagesCss ? '✅' : '❌'} messages.css link`);
  console.log(`${hasFormElement ? '✅' : '❌'} Formulario de mensajes`);
  
} catch (err) {
  console.log('❌ Error leyendo messages.html');
}

console.log('\n🎯 Análisis Completado');
console.log('═'.repeat(50));
console.log('❌ Si ves muchos "❌", esos son los problemas a solucionar');
console.log('✅ Si todo está en "✅", el problema puede estar en:');
console.log('   • Token JWT inválido');
console.log('   • Usuario no autenticado');
console.log('   • Servidor no iniciado');
console.log('   • Problemas de red/CORS');
