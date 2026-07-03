/**
 * Validación central de variables de entorno al arranque.
 */

const isProd = process.env.NODE_ENV === "production";

export function validateEnvOrExit(): void {
  const errors: string[] = [];

  if (isProd) {
    if (!process.env.MONGODB_URI?.trim()) {
      errors.push("MONGODB_URI es obligatorio en producción.");
    }
    const sec = process.env.SESSION_SECRET;
    if (!sec || sec.length < 32) {
      errors.push(
        "SESSION_SECRET debe tener al menos 32 caracteres en producción."
      );
    }
    const googleOk =
      process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!googleOk) {
      errors.push(
        "GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET son obligatorios en producción si usas login con Google."
      );
    }
  } else {
    if (!process.env.MONGODB_URI?.trim()) {
      console.warn(
        "[env] MONGODB_URI no está definida: la app funcionará sin persistencia Mongo (solo desarrollo)."
      );
    }
  }

  if (errors.length > 0) {
    console.error("=== Error de configuración (variables de entorno) ===");
    for (const e of errors) console.error(`  • ${e}`);
    console.error("======================================================");
    process.exit(1);
  }
}
