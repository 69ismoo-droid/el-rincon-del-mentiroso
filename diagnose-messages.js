#!/usr/bin/env node

// Script de Diagnóstico para Sistema de Mensajes
const http = require('http');
const io = require('socket.io-client');

console.log('🔍 Diagnóstico del Sistema de Mensajes');
console.log('═'.repeat(50));

// 1. Verificar si el servidor está corriendo
async function checkServer() {
  return new Promise((resolve) => {
    console.log('1️⃣ Verificando servidor...');
    
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
          console.log('✅ Servidor respondiendo');
          console.log(`📦 Versión: ${version.version}`);
          console.log(`📄 Nombre: ${version.name}`);
          resolve({ status: 'online', version });
        } catch (err) {
          console.log('❌ Respuesta inválida del servidor');
          resolve({ status: 'invalid_response', error: err.message });
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Servidor no responde');
      console.log(`📍 Error: ${err.message}`);
      resolve({ status: 'offline', error: err.message });
    });

    req.on('timeout', () => {
      console.log('❌ Timeout del servidor');
      req.destroy();
      resolve({ status: 'timeout', error: 'Server timeout' });
    });

    req.end();
  });
}

// 2. Verificar Socket.IO
async function checkSocketIO() {
  return new Promise((resolve) => {
    console.log('\n2️⃣ Verificando Socket.IO...');
    
    try {
      const socket = io('http://localhost:10000', {
        timeout: 5000,
        transports: ['websocket', 'polling']
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.log('❌ Timeout de Socket.IO');
        resolve({ status: 'socket_timeout', error: 'Socket.IO timeout' });
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Socket.IO conectado');
        console.log(`🔌 ID: ${socket.id}`);
        
        socket.disconnect();
        resolve({ status: 'socket_connected', id: socket.id });
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        console.log('❌ Error de conexión Socket.IO');
        console.log(`📍 Error: ${err.message}`);
        resolve({ status: 'socket_error', error: err.message });
      });

    } catch (err) {
      console.log('❌ Error inicializando Socket.IO');
      console.log(`📍 Error: ${err.message}`);
      resolve({ status: 'socket_init_error', error: err.message });
    }
  });
}

// 3. Verificar archivos críticos
function checkFiles() {
  console.log('\n3️⃣ Verificando archivos críticos...');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'server.js',
    'public/messages.html',
    'public/messages.js',
    'public/messages.css',
    'models.js',
    'database-mongo.js'
  ];

  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    
    if (!exists) {
      allFilesExist = false;
    }
  });

  return { status: allFilesExist ? 'files_ok' : 'files_missing' };
}

// 4. Verificar dependencias
function checkDependencies() {
  console.log('\n4️⃣ Verificando dependencias...');
  
  try {
    const packageJson = require('./package.json');
    const requiredDeps = ['socket.io', 'express', 'mongoose'];
    let allDepsOk = true;
    
    requiredDeps.forEach(dep => {
      const installed = packageJson.dependencies[dep];
      const status = installed ? '✅' : '❌';
      console.log(`${status} ${dep}: ${installed || 'NO INSTALADA'}`);
      
      if (!installed) {
        allDepsOk = false;
      }
    });

    return { status: allDepsOk ? 'deps_ok' : 'deps_missing' };
  } catch (err) {
    console.log('❌ Error leyendo package.json');
    return { status: 'package_error', error: err.message };
  }
}

// 5. Verificar configuración de MongoDB
function checkMongoConfig() {
  console.log('\n5️⃣ Verificando configuración MongoDB...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Verificar .env
    const envPath = path.join(__dirname, '.env');
    const envExists = fs.existsSync(envPath);
    console.log(`${envExists ? '✅' : '❌'} .env file`);
    
    if (envExists) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasMongoUri = envContent.includes('MONGODB_URI');
      console.log(`${hasMongoUri ? '✅' : '❌'} MONGODB_URI configurada`);
    }
    
    // Verificar render.yaml
    const renderPath = path.join(__dirname, 'render.yaml');
    const renderExists = fs.existsSync(renderPath);
    console.log(`${renderExists ? '✅' : '❌'} render.yaml`);
    
    return { status: 'config_checked' };
  } catch (err) {
    console.log('❌ Error verificando configuración');
    return { status: 'config_error', error: err.message };
  }
}

// 6. Verificar rutas de API
async function checkAPIRoutes() {
  return new Promise((resolve) => {
    console.log('\n6️⃣ Verificando rutas de API...');
    
    const routes = [
      '/api/version',
      '/api/mensajes',
      '/api/auth/me'
    ];

    let checkedRoutes = 0;
    let routesOk = 0;

    routes.forEach(route => {
      const options = {
        hostname: 'localhost',
        port: 10000,
        path: route,
        method: 'GET',
        timeout: 3000
      };

      const req = http.request(options, (res) => {
        console.log(`✅ ${route} - ${res.statusCode}`);
        routesOk++;
        checkedRoutes++;
        
        if (checkedRoutes === routes.length) {
          resolve({ status: routesOk === routes.length ? 'routes_ok' : 'routes_partial', ok: routesOk, total: routes.length });
        }
      });

      req.on('error', () => {
        console.log(`❌ ${route} - Error`);
        checkedRoutes++;
        
        if (checkedRoutes === routes.length) {
          resolve({ status: 'routes_error', ok: routesOk, total: routes.length });
        }
      });

      req.on('timeout', () => {
        console.log(`❌ ${route} - Timeout`);
        req.destroy();
        checkedRoutes++;
        
        if (checkedRoutes === routes.length) {
          resolve({ status: 'routes_timeout', ok: routesOk, total: routes.length });
        }
      });

      req.end();
    });
  });
}

// Diagnóstico completo
async function runDiagnosis() {
  console.log('🔍 Iniciando diagnóstico completo...\n');
  
  const results = {
    server: await checkServer(),
    socket: await checkSocketIO(),
    files: checkFiles(),
    dependencies: checkDependencies(),
    config: checkMongoConfig(),
    routes: await checkAPIRoutes()
  };

  console.log('\n📊 Resumen del Diagnóstico:');
  console.log('═'.repeat(50));
  
  Object.entries(results).forEach(([key, result]) => {
    const icon = result.status.includes('ok') || result.status.includes('connected') || result.status.includes('online') ? '✅' : '❌';
    console.log(`${icon} ${key}: ${result.status}`);
  });

  console.log('\n🎯 Recomendaciones:');
  
  if (results.server.status !== 'online') {
    console.log('❌ El servidor no está corriendo. Ejecuta: npm start');
  }
  
  if (results.socket.status !== 'socket_connected') {
    console.log('❌ Socket.IO no funciona. Verifica la configuración del servidor.');
  }
  
  if (results.files.status !== 'files_ok') {
    console.log('❌ Faltan archivos críticos. Verifica que todos los archivos existan.');
  }
  
  if (results.dependencies.status !== 'deps_ok') {
    console.log('❌ Faltan dependencias. Ejecuta: npm install');
  }
  
  if (results.routes.status !== 'routes_ok') {
    console.log('❌ Las rutas API no responden correctamente.');
  }

  console.log('\n🔧 Si todo está en ✅, el problema puede estar en:');
  console.log('• Token JWT inválido o expirado');
  console.log('• Usuario no autenticado');
  console.log('• Problemas en el frontend (messages.html)');
  console.log('• Configuración de CORS');
  console.log('• Conexión a MongoDB');
}

// Ejecutar diagnóstico
runDiagnosis().catch(console.error);
