import { User } from '../models/User.js';
import { HttpError } from '../lib/httpError.js';
import { mailService } from '../mail/mailService.js';
import {
  generateOTPCode,
  getOTPExpiryDate,
  isOTPExpired,
  MAX_FAILED_VERIFY_ATTEMPTS,
  MAX_RESENDS_PER_HOUR,
  RESEND_WINDOW_MS,
} from '../utils/otp.js';
import type { ResendCodeBody, VerifyEmailBody } from '../schemas/authSchemas.js';

const OTP_SELECT_FIELDS =
  '+otpCode +otpExpires +otpFailedAttempts +otpResendCount +otpResendWindowStart';

export interface VerifyEmailResult {
  message: string;
  verified: true;
  needsProfile: boolean;
}

export interface ResendCodeResult {
  message: string;
  email: string;
  remainingResends: number;
}

function assertResendAllowed(user: {
  otpResendCount?: number;
  otpResendWindowStart?: Date;
}): void {
  const now = Date.now();
  const windowStart = user.otpResendWindowStart?.getTime();

  if (!windowStart || now - windowStart > RESEND_WINDOW_MS) {
    user.otpResendCount = 0;
    user.otpResendWindowStart = new Date(now);
  }

  if ((user.otpResendCount ?? 0) >= MAX_RESENDS_PER_HOUR) {
    const retryAt = new Date((user.otpResendWindowStart?.getTime() ?? now) + RESEND_WINDOW_MS);
    throw new HttpError(
      429,
      `Has alcanzado el límite de ${MAX_RESENDS_PER_HOUR} reenvíos por hora. Intenta nuevamente más tarde.`,
      { blockedUntil: retryAt.toISOString() }
    );
  }
}

export async function verifyEmail(input: VerifyEmailBody): Promise<VerifyEmailResult> {
  const { email, code } = input;

  const user = await User.findOne({ email, isVerified: false }).select(OTP_SELECT_FIELDS);

  if (!user) {
    throw new HttpError(400, 'Código inválido o expirado');
  }

  if ((user.otpFailedAttempts ?? 0) >= MAX_FAILED_VERIFY_ATTEMPTS) {
    throw new HttpError(
      429,
      'Demasiados intentos incorrectos. Solicita un nuevo código con reenviar código.'
    );
  }

  if (!user.otpCode || isOTPExpired(user.otpExpires)) {
    throw new HttpError(400, 'El código ha expirado. Solicita uno nuevo.');
  }

  if (user.otpCode !== code) {
    user.otpFailedAttempts = (user.otpFailedAttempts ?? 0) + 1;
    await user.save();

    const remaining = MAX_FAILED_VERIFY_ATTEMPTS - user.otpFailedAttempts;
    if (remaining <= 0) {
      throw new HttpError(
        429,
        'Demasiados intentos incorrectos. Solicita un nuevo código con reenviar código.'
      );
    }

    throw new HttpError(
      400,
      `Código incorrecto. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`
    );
  }

  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.otpFailedAttempts = 0;
  user.otpResendCount = 0;
  user.otpResendWindowStart = undefined;
  await user.save();

  return {
    message: 'Correo verificado exitosamente',
    verified: true,
    needsProfile: true,
  };
}

export async function resendVerificationCode(input: ResendCodeBody): Promise<ResendCodeResult> {
  const { email } = input;

  const user = await User.findOne({ email, isVerified: false }).select(OTP_SELECT_FIELDS);

  if (!user) {
    throw new HttpError(
      404,
      'No se encontró un usuario pendiente de verificación con ese email'
    );
  }

  assertResendAllowed(user);

  const otpCode = generateOTPCode();
  user.otpCode = otpCode;
  user.otpExpires = getOTPExpiryDate();
  user.otpFailedAttempts = 0;
  user.otpResendCount = (user.otpResendCount ?? 0) + 1;
  await user.save();

  try {
    await mailService.sendVerificationCode(email, otpCode, true);
  } catch {
    throw new HttpError(
      500,
      'No se pudo enviar el correo de verificación. Verifica tu configuración de Brevo.'
    );
  }

  const remainingResends = Math.max(0, MAX_RESENDS_PER_HOUR - user.otpResendCount);

  return {
    message: 'Nuevo código enviado a tu correo institucional',
    email,
    remainingResends,
  };
}
