import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError.js';
import { resendVerificationCode, verifyEmail } from '../services/verificationService.js';
import { resendCodeBodySchema, verifyEmailBodySchema } from '../schemas/authSchemas.js';

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join('. ');
}

export async function verifyEmailHandler(req: Request, res: Response): Promise<void> {
  const parsed = verifyEmailBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, formatZodError(parsed.error));
  }

  const result = await verifyEmail(parsed.data);
  res.json(result);
}

export async function resendCodeHandler(req: Request, res: Response): Promise<void> {
  const parsed = resendCodeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, formatZodError(parsed.error));
  }

  const result = await resendVerificationCode(parsed.data);
  res.json(result);
}
