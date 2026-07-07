import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError.js';
import { registerUser } from '../services/registrationService.js';
import { completeUserProfile, getCurrentUser, loginUser, logoutUser } from '../services/authService.js';
import {
  completeProfileBodySchema,
  loginBodySchema,
  registerBodySchema,
} from '../schemas/authSchemas.js';

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join('. ');
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, formatZodError(parsed.error));
  }

  const result = await registerUser(parsed.data);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, formatZodError(parsed.error));
  }

  const result = await loginUser(parsed.data, req);
  res.json(result);
}

export async function completeProfile(req: Request, res: Response): Promise<void> {
  const parsed = completeProfileBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, formatZodError(parsed.error));
  }

  const result = await completeUserProfile(parsed.data);
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await getCurrentUser(req);
  res.json({ user });
}

export async function logout(req: Request, res: Response): Promise<void> {
  await logoutUser(req, res);
}
