import express from 'express';
import { routeAsync } from '../middleware/routeAsync.js';
import { requireDb } from '../middleware/auth.js';
import {
  completeProfile,
  login,
  logout,
  me,
  register,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', requireDb, routeAsync(register));
router.post('/login', requireDb, routeAsync(login));
router.post('/complete-profile', requireDb, routeAsync(completeProfile));
router.get('/me', requireDb, routeAsync(me));
router.post('/logout', routeAsync(logout));

export default router;
