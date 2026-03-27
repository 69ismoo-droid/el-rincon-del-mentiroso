#!/usr/bin/env node

// Sistema de Versionamiento Semántico para "El Rincón del Mentiroso"
const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, 'version.json');

function readVersion() {
  try {
    return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
  } catch (error) {
    console.error('❌ Error leyendo version.json:', error.message);
    process.exit(1);
  }
}

function writeVersion(versionData) {
  try {
    fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2));
    console.log('✅ Version.json actualizado');
  } catch (error) {
    console.error('❌ Error escribiendo version.json:', error.message);
    process.exit(1);
  }
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function formatVersion(major, minor, patch) {
  return `${major}.${minor}.${patch}`;
}

function getNextVersion(current, type) {
  const { major, minor, patch } = parseVersion(current);
  
  switch (type) {
    case 'major':
      return formatVersion(major + 1, 0, 0);
    case 'minor':
      return formatVersion(major, minor + 1, 0);
    case 'patch':
      return formatVersion(major, minor, patch + 1);
    default:
      throw new Error('Tipo de versión inválido. Usa: major, minor, o patch');
  }
}

function updateChangelog(versionData, newVersion, type, description) {
  const entry = {
    version: newVersion,
    date: new Date().toISOString().split('T')[0],
    type: type,
    description: description,
    features: []
  };
  
  versionData.changelog.unshift(entry);
  versionData.version = newVersion;
  
  // Actualizar próximas versiones
  const current = parseVersion(newVersion);
  versionData.nextVersion = {
    major: formatVersion(current.major + 1, 0, 0),
    minor: formatVersion(current.major, current.minor + 1, 0),
    patch: formatVersion(current.major, current.minor, current.patch + 1)
  };
  
  return versionData;
}

function commitVersion(version, type, description) {
  console.log(`🏷️ Versionando: ${version} → ${getNextVersion(version, type)}`);
  console.log(`📝 Tipo: ${type.toUpperCase()}`);
  console.log(`📄 Descripción: ${description}`);
  
  const versionData = readVersion();
  const newVersion = getNextVersion(version, type);
  
  // Actualizar changelog
  const updatedData = updateChangelog(versionData, newVersion, type, description);
  
  // Guardar cambios
  writeVersion(updatedData);
  
  // Crear tag de Git
  const gitTag = `v${newVersion}`;
  console.log(`🔧 Creando tag de Git: ${gitTag}`);
  
  return {
    oldVersion: version,
    newVersion: newVersion,
    gitTag: gitTag,
    type: type,
    description: description
  };
}

// CLI para versionamiento
const args = process.argv.slice(2);
const command = args[0];

if (command === 'bump') {
  const type = args[1]; // major, minor, patch
  const description = args.slice(2).join(' ') || 'Actualización del sistema';
  
  if (!['major', 'minor', 'patch'].includes(type)) {
    console.error('❌ Tipo inválido. Usa: node version.js bump [major|minor|patch] "descripción"');
    process.exit(1);
  }
  
  const versionData = readVersion();
  const result = commitVersion(versionData.version, type, description);
  
  console.log('\n✅ Versionamiento completado:');
  console.log(`📦 Versión anterior: ${result.oldVersion}`);
  console.log(`🆕 Nueva versión: ${result.newVersion}`);
  console.log(`🏷️ Git tag: ${result.gitTag}`);
  console.log(`📝 Tipo: ${result.type.toUpperCase()}`);
  console.log(`📄 Descripción: ${result.description}`);
  
  console.log('\n🔗 Comandos para Git:');
  console.log(`git add version.json`);
  console.log(`git commit -m "🏷️ ${result.newVersion}: ${result.description}"`);
  console.log(`git tag ${result.gitTag}`);
  console.log(`git push origin main`);
  console.log(`git push origin ${result.gitTag}`);
  
} else if (command === 'current') {
  const versionData = readVersion();
  console.log(`📦 Versión actual: ${versionData.version}`);
  console.log(`📄 Nombre: ${versionData.name}`);
  console.log(`📋 Descripción: ${versionData.description}`);
  
} else if (command === 'changelog') {
  const versionData = readVersion();
  console.log('📋 Historial de Cambios:');
  console.log('═'.repeat(50));
  
  versionData.changelog.forEach(entry => {
    const emoji = entry.type === 'major' ? '🚀' : entry.type === 'minor' ? '✨' : '🔧';
    console.log(`${emoji} v${entry.version} - ${entry.date} (${entry.type.toUpperCase()})`);
    console.log(`📄 ${entry.description}`);
    if (entry.features.length > 0) {
      console.log('🔹 Características:');
      entry.features.forEach(feature => console.log(`   • ${feature}`));
    }
    console.log('');
  });
  
} else if (command === 'next') {
  const versionData = readVersion();
  console.log('🔮 Próximas versiones:');
  console.log(`🚀 Major: ${versionData.nextVersion.major}`);
  console.log(`✨ Minor: ${versionData.nextVersion.minor}`);
  console.log(`🔧 Patch: ${versionData.nextVersion.patch}`);
  
} else {
  console.log('🏷️ Sistema de Versionamiento - El Rincón del Mentiroso');
  console.log('');
  console.log('Comandos:');
  console.log('  node version.js current              - Mostrar versión actual');
  console.log('  node version.js changelog            - Mostrar historial de cambios');
  console.log('  node version.js next                 - Mostrar próximas versiones');
  console.log('  node version.js bump [type] [desc]   - Crear nueva versión');
  console.log('');
  console.log('Tipos:');
  console.log('  major  - Cambios importantes (1.0.0 → 2.0.0)');
  console.log('  minor  - Nuevas características (1.0.0 → 1.1.0)');
  console.log('  patch  - Correcciones menores (1.0.0 → 1.0.1)');
  console.log('');
  console.log('Ejemplos:');
  console.log('  node version.js bump major "Sistema de mensajes en tiempo real"');
  console.log('  node version.js bump minor "Agregar notificaciones push"');
  console.log('  node version.js bump patch "Fix login error"');
}
