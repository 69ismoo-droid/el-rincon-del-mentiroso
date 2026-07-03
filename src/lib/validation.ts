import { z } from 'zod';

// Esquema de validación para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido')
    .refine((email) => email.endsWith('@cusco.coar.edu.pe'), {
      message: 'Solo se permiten correos institucionales @cusco.coar.edu.pe',
    }),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Esquema de validación para registro
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido')
    .refine((email) => email.endsWith('@cusco.coar.edu.pe'), {
      message: 'Solo se permiten correos institucionales @cusco.coar.edu.pe',
    }),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Esquema de validación para completar perfil
export const completeProfileSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  nombreCompleto: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  añoIngreso: z
    .number()
    .int('El año debe ser un número entero')
    .min(2000, 'Año inválido')
    .max(new Date().getFullYear(), 'El año no puede ser futuro'),
});

export type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

// Esquema de validación para año de ingreso
export const anioIngresoSchema = z.object({
  añoIngreso: z
    .number()
    .int('El año debe ser un número entero')
    .min(2000, 'Año inválido')
    .max(new Date().getFullYear(), 'El año no puede ser futuro'),
});

export type AnioIngresoFormData = z.infer<typeof anioIngresoSchema>;

// Esquema de validación para posts del foro
export const postSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(280, 'El título no puede exceder 280 caracteres'),
  content: z
    .string()
    .min(1, 'El contenido es requerido')
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .max(50000, 'El contenido es demasiado largo'),
  category: z.enum(['General', 'Matemática (Bachillerato)', 'Literatura', 'Vida Escolar', 'Consejos ExCOAR']),
});

export type PostFormData = z.infer<typeof postSchema>;

// Esquema de validación para comentarios
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario es requerido')
    .min(1, 'El comentario debe tener al menos 1 carácter')
    .max(10000, 'El comentario es demasiado largo'),
});

export type CommentFormData = z.infer<typeof commentSchema>;

// Esquema de validación para objetos perdidos
export const lostItemSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción es demasiado larga'),
  location: z
    .string()
    .min(1, 'La ubicación es requerida')
    .min(3, 'La ubicación debe tener al menos 3 caracteres'),
});

export type LostItemFormData = z.infer<typeof lostItemSchema>;

// Esquema de validación para noticias
export const newsSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  content: z
    .string()
    .min(1, 'El contenido es requerido')
    .min(20, 'El contenido debe tener al menos 20 caracteres')
    .max(10000, 'El contenido es demasiado largo'),
  category: z.enum(['ACADEMICO', 'MINEDU', 'RESIDENCIA', 'COMEDOR', 'EVENTOS']),
});

export type NewsFormData = z.infer<typeof newsSchema>;

// Esquema de validación para código OTP
export const otpCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es requerido')
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d+$/, 'El código debe contener solo números'),
});

export type OtpCodeFormData = z.infer<typeof otpCodeSchema>;
