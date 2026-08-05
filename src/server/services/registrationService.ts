import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { HttpError } from '../lib/httpError.js';
import { mailService } from '../mail/mailService.js';
import { generateOTPCode, getOTPExpiryDate } from '../utils/otp.js';
import type { RegisterBody } from '../schemas/authSchemas.js';
import { logger } from '../lib/logger.js';

export interface RegisterResult {
  message: string;
  email: string;
}

export async function registerUser(input: RegisterBody): Promise<RegisterResult> {
  const { email, password } = input;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new HttpError(409, 'Este correo ya está registrado');
  }

  const otpCode = generateOTPCode();
  const otpExpires = getOTPExpiryDate();
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = new User({
    email,
    password: hashedPassword,
    otpCode,
    otpExpires,
    isVerified: false,
    nombreCompleto: 'Pendiente',
    añoIngreso: new Date().getFullYear(),
    otpFailedAttempts: 0,
    otpResendCount: 0,
  });

  await user.save();

  try {
    await mailService.sendVerificationCode(email, otpCode);
  } catch (error) {
    logger.error('ERROR REAL DE BREVO AL ENVIAR CORREO DE VERIFICACIÓN (registro)', { error });
    await User.deleteOne({ email });
    throw new HttpError(
      500,
      'No se pudo enviar el correo de verificación. Verifica tu configuración de Brevo.'
    );
  }

  return {
    message:
      'Registro iniciado. Revisa tu correo institucional para obtener tu código de verificación.',
    email,
  };
}
