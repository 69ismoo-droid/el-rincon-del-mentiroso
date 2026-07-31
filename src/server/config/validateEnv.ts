/**
 * Validación central de variables de entorno al arranque.
 */

import {
  getPublicUrl,
  isPlaceholderSmtpKey,
  isPlaceholderSmtpUser,
  isProductionEnv,
} from './env.js';

export function validateEnvOrExit(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isProductionEnv()) {
    if (!process.env.MONGODB_URI?.trim()) {
      errors.push('MONGODB_URI es obligatorio en producción.');
    }

    const sec = process.env.SESSION_SECRET;
    if (!sec || sec.length < 32) {
      errors.push('SESSION_SECRET debe tener al menos 32 caracteres en producción.');
    }
    if (sec === 'genera_una_clave_segura_de_al_menos_32_caracteres' ||
        sec === 'TuClaveSecretaSuperSeguraDe32CaracteresMinimo') {
      errors.push('SESSION_SECRET no puede ser el valor de ejemplo. Genera uno con npm run generate:secret.');
    }

    // SMTP es opcional en producción
    if (process.env.SMTP_PASS?.trim() && isPlaceholderSmtpKey(process.env.SMTP_PASS)) {
      errors.push('SMTP_PASS parece un placeholder. Usa tu clave SMTP real de Brevo.');
    }

    if (process.env.SMTP_USER?.trim() && isPlaceholderSmtpUser(process.env.SMTP_USER)) {
      errors.push('SMTP_USER parece un placeholder. Usa el email de tu cuenta Brevo.');
    }

    const publicUrl = getPublicUrl();
    if (!publicUrl) {
      warnings.push(
        'PUBLIC_URL no está definida. En Render se usa RENDER_EXTERNAL_URL automáticamente; en otros hosts configúrala.'
      );
    } else if (!publicUrl.startsWith('https://')) {
      warnings.push('PUBLIC_URL no usa HTTPS. Las cookies seguras pueden no activarse correctamente.');
    }
  } else {
    if (!process.env.MONGODB_URI?.trim()) {
      console.warn(
        '[env] MONGODB_URI no está definida: la app funcionará sin persistencia Mongo (solo desarrollo).'
      );
    }
  }

  if (warnings.length > 0) {
    console.warn('=== Avisos de configuración ===');
    for (const w of warnings) console.warn(`  • ${w}`);
    console.warn('===============================');
  }

  if (errors.length > 0) {
    console.error('=== Error de configuración (variables de entorno) ===');
    for (const e of errors) console.error(`  • ${e}`);
    console.error('======================================================');
    process.exit(1);
  }
}
