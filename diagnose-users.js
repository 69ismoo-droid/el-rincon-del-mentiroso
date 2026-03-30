// Script para diagnosticar problemas de datos de usuario
const { User } = require('./models');
const database = require('./database-mongo.js');

console.log('🔍 Diagnóstico de Datos de Usuario');
console.log('═'.repeat(50));

async function diagnoseUserData() {
  try {
    // Conectar a la base de datos
    await database.connect();
    console.log('✅ Conectado a MongoDB');

    // 1. Verificar usuarios en la base de datos
    console.log('\n1️⃣ Verificando usuarios en la base de datos...');
    const allUsers = await database.getAllUsers();
    console.log(`📊 Total de usuarios: ${allUsers.length}`);

    if (allUsers.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    // 2. Mostrar cada usuario con sus datos
    console.log('\n2️⃣ Detalles de usuarios:');
    allUsers.forEach((user, index) => {
      console.log(`\n👤 Usuario ${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   DisplayName: ${user.displayName || 'UNDEFINED'}`);
      console.log(`   Role: ${user.role || 'UNDEFINED'}`);
      console.log(`   InviteCode: ${user.inviteCode || 'UNDEFINED'}`);
      console.log(`   CreatedAt: ${user.createdAt || 'UNDEFINED'}`);
      console.log(`   Email Validado: ${user.emailValidated || 'UNDEFINED'}`);
      
      // Verificar campos problemáticos
      const problems = [];
      if (!user.displayName) problems.push('displayName');
      if (!user.role) problems.push('role');
      if (!user.createdAt) problems.push('createdAt');
      
      if (problems.length > 0) {
        console.log(`   ⚠️ Campos faltantes: ${problems.join(', ')}`);
      } else {
        console.log(`   ✅ Todos los campos presentes`);
      }
    });

    // 3. Verificar usuario admin específicamente
    console.log('\n3️⃣ Buscando usuario admin...');
    const adminUser = allUsers.find(u => u.email === 'cruel@admin');
    
    if (adminUser) {
      console.log('✅ Usuario admin encontrado:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   DisplayName: ${adminUser.displayName || 'UNDEFINED'}`);
      console.log(`   Role: ${adminUser.role || 'UNDEFINED'}`);
      console.log(`   CreatedAt: ${adminUser.createdAt || 'UNDEFINED'}`);
      
      if (!adminUser.displayName) {
        console.log('❌ Admin no tiene displayName');
      }
      if (!adminUser.createdAt) {
        console.log('❌ Admin no tiene createdAt');
      }
    } else {
      console.log('❌ Usuario admin no encontrado');
    }

    // 4. Verificar fechas
    console.log('\n4️⃣ Analizando fechas...');
    allUsers.forEach(user => {
      if (user.createdAt) {
        const date = new Date(user.createdAt);
        const isValid = !isNaN(date.getTime());
        console.log(`   ${user.email}: ${isValid ? '✅' : '❌'} ${date.toString()}`);
      } else {
        console.log(`   ${user.email}: ❌ Sin fecha de creación`);
      }
    });

    // 5. Verificar estructura de datos
    console.log('\n5️⃣ Estructura de datos esperada vs actual:');
    const expectedFields = ['email', 'displayName', 'role', 'inviteCode', 'createdAt', 'emailValidated'];
    
    if (allUsers.length > 0) {
      const sampleUser = allUsers[0];
      console.log('   Campos esperados:');
      expectedFields.forEach(field => {
        const hasField = sampleUser.hasOwnProperty(field);
        console.log(`   ${hasField ? '✅' : '❌'} ${field}`);
      });
      
      console.log('\n   Campos actuales en el usuario:');
      Object.keys(sampleUser).forEach(field => {
        console.log(`   📋 ${field}: ${sampleUser[field]}`);
      });
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await database.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar diagnóstico
diagnoseUserData().catch(console.error);
