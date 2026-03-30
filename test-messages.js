// Script de Prueba para Sistema de Mensajes
console.log('🧪 Iniciando Prueba del Sistema de Mensajes');
console.log('═'.repeat(50));

// 1. Verificar que el servidor esté corriendo
const http = require('http');

async function testServer() {
  return new Promise((resolve) => {
    console.log('1️⃣ Probando conexión al servidor...');
    
    const options = {
      hostname: 'localhost',
      port: 10000,
      path: '/api/version',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const version = JSON.parse(data);
          console.log('✅ Servidor respondiendo correctamente');
          console.log(`📦 Versión: ${version.version}`);
          resolve(true);
        } catch (err) {
          console.log('❌ Respuesta inválida del servidor');
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ Servidor no está corriendo');
      console.log('💡 Solución: Ejecuta npm start');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Timeout del servidor');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 2. Verificar ruta de mensajes
async function testMessagesRoute() {
  return new Promise((resolve) => {
    console.log('\n2️⃣ Probando ruta de mensajes...');
    
    const options = {
      hostname: 'localhost',
      port: 10000,
      path: '/api/mensajes',
      method: 'GET',
      timeout: 5000,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Ruta /api/mensajes responde (${res.statusCode})`);
      
      if (res.statusCode === 401) {
        console.log('✅ Autenticación funciona (requiere token)');
      } else if (res.statusCode === 500) {
        console.log('❌ Error interno del servidor');
      }
      
      resolve(res.statusCode === 401);
    });

    req.on('error', () => {
      console.log('❌ Error en ruta de mensajes');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Timeout en ruta de mensajes');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 3. Verificar página de mensajes
async function testMessagesPage() {
  return new Promise((resolve) => {
    console.log('\n3️⃣ Probando página de mensajes...');
    
    const options = {
      hostname: 'localhost',
      port: 10000,
      path: '/messages.html',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Página messages.html responde (${res.statusCode})`);
      
      if (res.statusCode === 200) {
        console.log('✅ Página de mensajes accesible');
      }
      
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      console.log('❌ Error accediendo a messages.html');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Timeout en messages.html');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 4. Verificar Socket.IO
async function testSocketIO() {
  return new Promise((resolve) => {
    console.log('\n4️⃣ Probando Socket.IO...');
    
    try {
      const io = require('socket.io-client');
      const socket = io('http://localhost:10000', {
        timeout: 5000,
        transports: ['websocket', 'polling']
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.log('❌ Timeout de Socket.IO');
        resolve(false);
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Socket.IO conectado correctamente');
        console.log(`🔌 ID: ${socket.id}`);
        
        // Probar evento de error
        socket.on('error', (err) => {
          console.log('❌ Error en Socket.IO:', err.message);
        });
        
        setTimeout(() => {
          socket.disconnect();
          resolve(true);
        }, 1000);
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        console.log('❌ Error de conexión Socket.IO:', err.message);
        resolve(false);
      });

    } catch (err) {
      console.log('❌ Error inicializando Socket.IO:', err.message);
      console.log('💡 Solución: npm install socket.io-client');
      resolve(false);
    }
  });
}

// 5. Verificar token de prueba
function testToken() {
  console.log('\n5️⃣ Verificando configuración de token...');
  
  const jwt = require('jsonwebtoken');
  const testPayload = {
    sub: 'test-user-id',
    email: 'test@cusco.coar.edu.pe',
    iat: Math.floor(Date.now() / 1000)
  };
  
  try {
    const testToken = jwt.sign(testPayload, 'test-secret');
    console.log('✅ JWT funciona correctamente');
    console.log('🔑 Token de prueba generado');
    return true;
  } catch (err) {
    console.log('❌ Error generando token JWT');
    return false;
  }
}

// Prueba completa
async function runTests() {
  console.log('🧪 Ejecutando pruebas del sistema de mensajes...\n');
  
  const results = {
    server: await testServer(),
    messagesRoute: await testMessagesRoute(),
    messagesPage: await testMessagesPage(),
    socketIO: await testSocketIO(),
    token: testToken()
  };

  console.log('\n📊 Resultados de las Pruebas:');
  console.log('═'.repeat(50));
  
  Object.entries(results).forEach(([key, passed]) => {
    const icon = passed ? '✅' : '❌';
    const name = {
      server: 'Servidor',
      messagesRoute: 'Ruta API',
      messagesPage: 'Página Web',
      socketIO: 'Socket.IO',
      token: 'JWT Token'
    }[key];
    
    console.log(`${icon} ${name}: ${passed ? 'OK' : 'FALLÓ'}`);
  });

  const allPassed = Object.values(results).every(r => r === true);
  
  console.log('\n🎯 ' + (allPassed ? 
    '✅ Todas las pruebas pasaron. El sistema debería funcionar correctamente.' : 
    '❌ Algunas pruebas fallaron. Revisa los errores arriba.'));
    
  if (!allPassed) {
    console.log('\n🔧 Pasos para solucionar:');
    
    if (!results.server) {
      console.log('• Inicia el servidor: npm start');
    }
    
    if (!results.messagesPage) {
      console.log('• Verifica que messages.html exista');
    }
    
    if (!results.socketIO) {
      console.log('• Instala socket.io-client: npm install socket.io-client');
    }
    
    if (!results.token) {
      console.log('• Verifica que jsonwebtoken esté instalado');
    }
  }

  console.log('\n🌐 Para probar manualmente:');
  console.log('1. Abre http://localhost:10000/login.html');
  console.log('2. Inicia sesión con usuario@cusco.coar.edu.pe');
  console.log('3. Ve a http://localhost:10000/messages.html');
  console.log('4. Intenta enviar un mensaje');
}

// Ejecutar pruebas
runTests().catch(console.error);
