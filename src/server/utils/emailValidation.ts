const INSTITUTIONAL_DOMAIN = '@cusco.coar.edu.pe';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInstitutionalEmail(email: string): boolean {
  return normalizeEmail(email).endsWith(INSTITUTIONAL_DOMAIN);
}
