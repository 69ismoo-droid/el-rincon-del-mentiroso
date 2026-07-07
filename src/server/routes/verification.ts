import express from 'express';
import { routeAsync } from '../middleware/routeAsync.js';
import { requireDb } from '../middleware/auth.js';
import {
  resendCodeHandler,
  verifyEmailHandler,
} from '../controllers/verificationController.js';

const router = express.Router();

router.post('/verify-email', requireDb, routeAsync(verifyEmailHandler));
router.post('/resend-code', requireDb, routeAsync(resendCodeHandler));

/** Compatibilidad con rutas anteriores */
router.post('/verify', requireDb, routeAsync(verifyEmailHandler));
router.post('/resend-otp', requireDb, routeAsync(resendCodeHandler));

export default router;
