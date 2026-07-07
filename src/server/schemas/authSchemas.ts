import { z } from 'zod';

const institutionalEmail = z
  .string()
  .trim()
  .min(1, 'El email es requerido')
  .email('Email inválido')
  .transform((v) => v.toLowerCase())
  .refine((email) => email.endsWith('@cusco.coar.edu.pe'), {
    message: 'Solo se permiten correos institucionales @cusco.coar.edu.pe',
  });

export const registerBodySchema = z.object({
  email: institutionalEmail,
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const verifyEmailBodySchema = z.object({
  email: institutionalEmail,
  code: z
    .string()
    .trim()
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),
});

export const resendCodeBodySchema = z.object({
  email: institutionalEmail,
});

export const loginBodySchema = z.object({
  email: institutionalEmail,
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const completeProfileBodySchema = z.object({
  email: institutionalEmail,
  nombreCompleto: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  añoIngreso: z.coerce
    .number()
    .int('El año debe ser un número entero')
    .min(2000, 'Año inválido')
    .max(new Date().getFullYear(), 'El año no puede ser futuro'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
export type ResendCodeBody = z.infer<typeof resendCodeBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type CompleteProfileBody = z.infer<typeof completeProfileBodySchema>;
