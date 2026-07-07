import crypto from 'crypto';

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
export const MAX_RESENDS_PER_HOUR = 3;
export const RESEND_WINDOW_MS = 60 * 60 * 1000;
export const MAX_FAILED_VERIFY_ATTEMPTS = 5;

/** Genera un código numérico aleatorio de 6 dígitos. */
export function generateOTPCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function getOTPExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MS);
}

export function isOTPExpired(expires: Date | undefined | null): boolean {
  if (!expires) return true;
  return expires.getTime() <= Date.now();
}
