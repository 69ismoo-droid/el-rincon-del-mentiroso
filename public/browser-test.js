
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
  console.log('\n2️⃣ Verificando API...');
  
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
  console.log('\n3️⃣ Verificando elementos del DOM...');
  
  const elements = [
    'userDisplayName',
    'userRole',
    'userEmail',
    'loginStatus'
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`Element ${id}:`, element ? 'EXISTS' : 'MISSING');
    if (element) {
      console.log('  Content:', element.textContent);
    }
  });
}

// 4. Verificar fechas
function checkDates() {
  console.log('\n4️⃣ Verificando manejo de fechas...');
  
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

console.log('\n🎯 Prueba completada. Revisa los resultados arriba.');
  