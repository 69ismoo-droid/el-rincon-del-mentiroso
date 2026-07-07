import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { HttpError } from '../lib/httpError.js';
import type { CompleteProfileBody, LoginBody } from '../schemas/authSchemas.js';
import type { Request, Response } from 'express';

export async function loginUser(
  input: LoginBody,
  req: Request
): Promise<{ message: string; user: Record<string, unknown> }> {
  const { email, password } = input;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  if (!user.isVerified) {
    throw new HttpError(403, 'Debes verificar tu correo antes de iniciar sesión', {
      needsVerification: true,
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  if (user.banned) {
    throw new HttpError(403, 'Usuario suspendido');
  }

  await persistSession(req, user._id.toString());

  return {
    message: 'Inicio de sesión exitoso',
    user: {
      email: user.email,
      nombreCompleto: user.nombreCompleto,
      displayName: user.displayName,
      añoIngreso: user.añoIngreso,
      role: user.role,
      isVerified: user.isVerified,
      credits: user.credits,
    },
  };
}

export async function completeUserProfile(
  input: CompleteProfileBody
): Promise<{ message: string; user: Record<string, unknown> }> {
  const { email, nombreCompleto, añoIngreso } = input;

  const user = await User.findOne({ email, isVerified: true });
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado o no verificado');
  }

  user.nombreCompleto = nombreCompleto;
  user.añoIngreso = añoIngreso;
  user.ingresoColegio = añoIngreso;
  user.name = nombreCompleto;
  await user.save();

  return {
    message: 'Perfil completado correctamente',
    user: {
      email: user.email,
      nombreCompleto: user.nombreCompleto,
      añoIngreso: user.añoIngreso,
      role: user.role,
      isVerified: user.isVerified,
    },
  };
}

export async function getCurrentUser(req: Request): Promise<Record<string, unknown>> {
  const userId = (req.session as { userId?: string }).userId;
  if (!userId) {
    throw new HttpError(401, 'No autorizado');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  return {
    email: user.email,
    nombreCompleto: user.nombreCompleto,
    displayName: user.displayName,
    name: user.nombreCompleto,
    añoIngreso: user.añoIngreso,
    ingresoColegio: user.ingresoColegio || user.añoIngreso,
    role: user.role,
    isVerified: user.isVerified,
    credits: user.credits,
    bio: user.bio,
    picture: user.picture,
  };
}

export function logoutUser(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session?.destroy((err) => {
      if (err) {
        reject(new HttpError(500, 'Error al cerrar sesión'));
        return;
      }
      res.json({ message: 'Sesión cerrada correctamente' });
      resolve();
    });
  });
}

function persistSession(req: Request, userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      reject(new HttpError(500, 'Sesión no disponible'));
      return;
    }
    (req.session as { userId?: string }).userId = userId;
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
