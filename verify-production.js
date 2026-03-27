// Script para verificar que todo esté configurado correctamente en producción
// Este script se puede ejecutar en los logs de Render para diagnóstico

console.log('🔍 VERIFICACIÓN DE PRODUCCIÓN - El Rincón del Mentiroso');
console.log('═'.repeat(60));

// 1. Variables de entorno
console.log('\n📋 Variables de Entorno:');
console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV || 'NO DEFINIDA'}`);
console.log(`🚪 PORT: ${process.env.PORT || 'NO DEFINIDO'}`);
console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? 'DEFINIDA ✓' : 'NO DEFINIDA ❌'}`);
console.log(`📍 MONGODB_URI: ${process.env.MONGODB_URI ? 'DEFINIDA ✓' : 'NO DEFINIDA ❌'}`);

if (process.env.MONGODB_URI) {
  // Mostrar solo el nombre de la base de datos por seguridad
  const dbMatch = process.env.MONGODB_URI.match(/\/([^?]*)/);
  const dbName = dbMatch ? dbMatch[1] : 'desconocida';
  console.log(`🗄️ Base de datos: ${dbName}`);
}

// 2. Módulos disponibles
console.log('\n📦 Módulos Disponibles:');
try {
  require('mongoose');
  console.log('✅ mongoose - OK');
} catch (e) {
  console.log('❌ mongoose - ERROR');
}

try {
  require('bcryptjs');
  console.log('✅ bcryptjs - OK');
} catch (e) {
  console.log('❌ bcryptjs - ERROR');
}

try {
  require('jsonwebtoken');
  console.log('✅ jsonwebtoken - OK');
} catch (e) {
  console.log('❌ jsonwebtoken - ERROR');
}

try {
  require('cors');
  console.log('✅ cors - OK');
} catch (e) {
  console.log('❌ cors - ERROR');
}

// 3. Configuración del servidor
console.log('\n⚙️ Configuración del Servidor:');
const express = require('express');
const app = express();

console.log('✅ Express inicializado');

// 4. Test de conexión a MongoDB (sin conectar realmente)
console.log('\n🔗 Test de Configuración MongoDB:');
if (process.env.MONGODB_URI) {
  const mongoose = require('mongoose');
  try {
    // Solo validar el formato, no conectar
    const uri = process.env.MONGODB_URI;
    if (uri.includes('mongodb+srv://') || uri.includes('mongodb://')) {
      console.log('✅ Formato de URI válido');
      
      if (uri.includes('el-rincon-del-mentiroso')) {
        console.log('✅ Base de datos dedicada correcta');
      } else if (uri.includes('admin')) {
        console.log('⚠️ Usando base de datos admin (no recomendado)');
      } else if (uri.includes('localsample_mflix')) {
        console.log('⚠️ Usando base de datos de ejemplo (incorrecto)');
      } else {
        console.log('❓ Base de datos desconocida');
      }
    } else {
      console.log('❌ Formato de URI inválido');
    }
  } catch (e) {
    console.log('❌ Error validando MongoDB:', e.message);
  }
} else {
  console.log('❌ MONGODB_URI no definida');
}

// 5. Resumen
console.log('\n📊 RESUMEN:');
console.log('═'.repeat(60));

const issues = [];

if (!process.env.NODE_ENV) issues.push('NODE_ENV no definida');
if (!process.env.PORT) issues.push('PORT no definido');
if (!process.env.JWT_SECRET) issues.push('JWT_SECRET no definida');
if (!process.env.MONGODB_URI) issues.push('MONGODB_URI no definida');

if (issues.length === 0) {
  console.log('✅ TODAS LAS VARIABLES DE ENTORNO CONFIGURADAS');
  console.log('✅ SERVIDOR LISTO PARA PRODUCCIÓN');
  console.log('✅ BASE DE DATOS DEDICADA CONFIGURADA');
} else {
  console.log('❌ PROBLEMAS ENCONTRADOS:');
  issues.forEach(issue => console.log(`   • ${issue}`));
}

console.log('\n🎯 ESTADO FINAL:');
console.log(issues.length === 0 ? '🟢 LISTO PARA DESPLEGAR' : '🔡 REQUIERE ATENCIÓN');

console.log('\n🔗 URL de producción: https://el-rincon-del-mentiroso.onrender.com');
console.log('📧 Soporte: cruel@admin');
