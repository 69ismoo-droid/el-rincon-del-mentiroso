// Script para diagnosticar problemas del frontend
console.log('🔍 Diagnóstico del Frontend - El Rincón del Mentiroso');
console.log('═'.repeat(50));

// 1. Verificar archivos del frontend
function checkFrontendFiles() {
  console.log('\n1️⃣ Verificando archivos del frontend...');
  
  const fs = require('fs');
  const path = require('path');
  
  const frontendFiles = [
    'public/index.html',
    'public/login.html',
    'public/signup.html',
    'public/admin.html',
    'public/messages.html',
    'public/app.js',
    'public/login.js',
    'public/signup.js',
    'public/messages.js',
    'public/styles.css',
    'public/messages.css'
  ];

  frontendFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  });
}

// 2. Verificar problemas comunes en app.js
function checkAppJS() {
  console.log('\n2️⃣ Verificando app.js...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const appContent = fs.readFileSync(path.join(__dirname, 'public/app.js'), 'utf8');
    
    const hasUserDisplay = appContent.includes('displayName');
    const hasDateHandling = appContent.includes('new Date');
    const hasUndefinedCheck = appContent.includes('undefined');
    const hasUserValidation = appContent.includes('user');
    
    console.log(`${hasUserDisplay ? '✅' : '❌'} Maneja displayName`);
    console.log(`${hasDateHandling ? '✅' : '❌'} Maneja fechas`);
    console.log(`${hasUndefinedCheck ? '✅' : '❌'} Verifica undefined`);
    console.log(`${hasUserValidation ? '✅' : '❌'} Valida usuario`);
    
    // Buscar patrones problemáticos
    if (appContent.includes('undefined')) {
      console.log('⚠️ Posibles problemas con undefined encontrados');
    }
    
  } catch (err) {
    console.log('❌ Error leyendo app.js');
  }
}

// 3. Verificar login.js
function checkLoginJS() {
  console.log('\n3️⃣ Verificando login.js...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const loginContent = fs.readFileSync(path.join(__dirname, 'public/login.js'), 'utf8');
    
    const hasTokenStorage = loginContent.includes('localStorage');
    const hasUserDisplay = loginContent.includes('displayName');
    const hasErrorHandling = loginContent.includes('catch');
    
    console.log(`${hasTokenStorage ? '✅' : '❌'} Guarda token en localStorage`);
    console.log(`${hasUserDisplay ? '✅' : '❌'} Maneja displayName`);
    console.log(`${hasErrorHandling ? '✅' : '❌'} Maneja errores`);
    
  } catch (err) {
    console.log('❌ Error leyendo login.js');
  }
}

// 4. Verificar HTML files
function checkHTMLFiles() {
  console.log('\n4️⃣ Verificando archivos HTML...');
  
  const fs = require('fs');
  const path = require('path');
  
  const htmlFiles = [
    'public/index.html',
    'public/admin.html',
    'public/messages.html'
  ];
  
  htmlFiles.forEach(file => {
    try {
      const htmlContent = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const hasAppScript = htmlContent.includes('app.js');
      const hasMessagesScript = htmlContent.includes('messages.js');
      const hasUserDisplay = htmlContent.includes('displayName');
      
      console.log(`\n📄 ${file}:`);
      console.log(`   ${hasAppScript ? '✅' : '❌'} app.js script`);
      console.log(`   ${hasMessagesScript ? '✅' : '❌'} messages.js script`);
      console.log(`   ${hasUserDisplay ? '✅' : '❌'} displayName handling`);
      
    } catch (err) {
      console.log(`❌ Error leyendo ${file}`);
    }
  });
}

// 5. Crear script de prueba para el navegador
function createBrowserTest() {
  console.log('\n5️⃣ Creando script de prueba para navegador...');
  
  const testScript = `
// Script de prueba para diagnosticar problemas en el navegador
console.log('🧪 Iniciando prueba en navegador...');

// 1. Verificar localStorage
function checkLocalStorage() {
  console.log('1️⃣ Verificando localStorage...');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token:', token ? 'EXISTS' : 'MISSING');
  console.log('User:', user ? 'EXISTS' : 'MISSING');
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User data:', userData);
      console.log('DisplayName:', userData.displayName || 'UNDEFINED');
      console.log('Email:', userData.email || 'UNDEFINED');
      console.log('Role:', userData.role || 'UNDEFINED');
    } catch (err) {
      console.log('❌ Error parseando user data:', err);
    }
  }
}

// 2. Verificar API
async function checkAPI() {
  console.log('\\n2️⃣ Verificando API...');
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API responde:', data);
      console.log('User ID:', data.user?.id || 'UNDEFINED');
      console.log('Email:', data.user?.email || 'UNDEFINED');
    } else {
      console.log('❌ API error:', response.status);
    }
  } catch (err) {
    console.log('❌ Error en API:', err);
  }
}

// 3. Verificar elementos del DOM
function checkDOM() {
  console.log('\\n3️⃣ Verificando elementos del DOM...');
  
  const elements = [
    'userDisplayName',
    'userRole',
    'userEmail',
    'loginStatus'
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    console.log(\`Element \${id}:\`, element ? 'EXISTS' : 'MISSING');
    if (element) {
      console.log('  Content:', element.textContent);
    }
  });
}

// 4. Verificar fechas
function checkDates() {
  console.log('\\n4️⃣ Verificando manejo de fechas...');
  
  const testDate = new Date();
  console.log('Test date:', testDate);
  console.log('Valid date:', !isNaN(testDate.getTime()) ? 'YES' : 'NO');
  console.log('Formatted date:', testDate.toLocaleDateString());
  
  // Probar fecha inválida
  const invalidDate = new Date('invalid');
  console.log('Invalid date:', invalidDate);
  console.log('Is invalid:', isNaN(invalidDate.getTime()) ? 'YES' : 'NO');
}

// Ejecutar pruebas
checkLocalStorage();
checkAPI();
checkDOM();
checkDates();

console.log('\\n🎯 Prueba completada. Revisa los resultados arriba.');
  `;
  
  const fs = require('fs');
  const path = require('path');
  
  fs.writeFileSync(path.join(__dirname, 'public/browser-test.js'), testScript);
  console.log('✅ Script de prueba creado: public/browser-test.js');
  console.log('💡 Para usar: Abre la consola del navegador y pega el contenido de browser-test.js');
}

// 6. Verificar problemas específicos de undefined
function checkUndefinedPatterns() {
  console.log('\n6️⃣ Buscando patrones de undefined...');
  
  const fs = require('fs');
  const path = require('path');
  
  const jsFiles = [
    'public/app.js',
    'public/login.js',
    'public/signup.js',
    'public/messages.js'
  ];
  
  jsFiles.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      
      const undefinedPatterns = [
        /\.displayName/g,
        /user\./g,
        /undefined/g,
        /null/g
      ];
      
      console.log(`\n📄 ${file}:`);
      undefinedPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        const count = matches ? matches.length : 0;
        console.log(`   Pattern ${index + 1}: ${count} coincidencias`);
      });
      
    } catch (err) {
      console.log(`❌ Error analizando ${file}`);
    }
  });
}

// Ejecutar diagnóstico completo
function runDiagnosis() {
  console.log('🔍 Iniciando diagnóstico completo del frontend...\n');
  
  checkFrontendFiles();
  checkAppJS();
  checkLoginJS();
  checkHTMLFiles();
  createBrowserTest();
  checkUndefinedPatterns();
  
  console.log('\n🎯 Diagnóstico completado');
  console.log('═'.repeat(50));
  console.log('💡 Para probar en el navegador:');
  console.log('1. Abre la aplicación');
  console.log('2. Abre la consola de desarrollador (F12)');
  console.log('3. Pega el contenido de public/browser-test.js');
  console.log('4. Revisa los resultados');
}

// Ejecutar
runDiagnosis();
