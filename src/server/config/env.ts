const PLACEHOLDER_SMTP_USERS = new Set([
  'tu-email@ejemplo.com',
  'your-email@example.com',
]);

const PLACEHOLDER_SMTP_KEY_MARKERS = ['xxxxxxxx', 'tu_clave', 'tu-api-key'];

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Valida las variables de entorno críticas o termina el proceso. */
export function validateEnvOrExit(): void {
  const critical = [
    'MONGODB_URI',
    'SESSION_SECRET'
  ];

  if (isProductionEnv()) {
    critical.push('BREVO_SMTP_KEY', 'BREVO_SMTP_USER', 'BREVO_FROM_EMAIL');
  }

  const missing = critical.filter(key => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error('\n❌ ERROR: Faltan variables de entorno críticas:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPor favor, configúralas en tu archivo .env o en el panel de control.\n');
    if (isProductionEnv()) process.exit(1);
  }
}

/** URL pública del sitio (Render inyecta RENDER_EXTERNAL_URL automáticamente). */
export function getPublicUrl(): string {
  const explicit = process.env.PUBLIC_URL?.trim();
  if (explicit) return explicit;

  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderUrl) {
    return renderUrl.startsWith('http') ? renderUrl : `https://${renderUrl}`;
  }

  return '';
}

export function isRunningOnRender(): boolean {
  return process.env.RENDER === 'true' || Boolean(process.env.RENDER_EXTERNAL_URL?.trim());
}

export function isPlaceholderSmtpUser(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return PLACEHOLDER_SMTP_USERS.has(value.trim().toLowerCase());
}

export function isPlaceholderSmtpKey(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const key = value.trim().toLowerCase();
  return PLACEHOLDER_SMTP_KEY_MARKERS.some((marker) => key.includes(marker));
}

export function shouldUseSecureSessionCookies(sameSite: 'lax' | 'strict' | 'none'): boolean {
  if (process.env.SESSION_COOKIE_SECURE === 'true') return true;
  if (process.env.SESSION_COOKIE_SECURE === 'false') return false;

  const publicUrl = getPublicUrl().toLowerCase();
  if (publicUrl.startsWith('https://')) return true;
  if (sameSite === 'none') return true;
  if (isProductionEnv() && isRunningOnRender()) return true;

  return false;
}
