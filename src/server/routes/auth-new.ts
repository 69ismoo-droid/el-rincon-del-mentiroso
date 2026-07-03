import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { emailService } from '../lib/emailService.js';
import { requireDb } from '../middleware/auth.js';

const router = express.Router();

// Validar que el correo sea institucional
const validateInstitutionalEmail = (email: string): boolean => {
  return email.endsWith('@cusco.coar.edu.pe');
};

// Generar código OTP de 6 dígitos
const generateOTPCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Registro inicial
router.post('/register', requireDb, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    if (!validateInstitutionalEmail(email)) {
      return res.status(400).json({ error: 'Solo se permiten correos institucionales @cusco.coar.edu.pe' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }

    // Generar código OTP
    const otpCode = generateOTPCode();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Crear usuario PENDIENTE de verificación
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      otpCode,
      otpExpires,
      isVerified: false, // Usuario no verificado hasta que ingrese código
      nombreCompleto: 'Pendiente',
      añoIngreso: new Date().getFullYear(),
    });

    await user.save();

    // TEMPORAL: Auto-verificar en desarrollo para pruebas
    if (process.env.NODE_ENV === 'development') {
      user.isVerified = true;
      user.otpCode = undefined;
      user.otpExpires = undefined;
      await user.save();

      res.json({
        message: 'Registro completado exitosamente (modo desarrollo).',
        email: email.toLowerCase(),
        verified: true,
        needsProfile: true
      });
    } else {
      // En producción, enviar email con código OTP
      try {
        const emailHtml = emailService.generateOTPEmail(otpCode, email);
        await emailService.sendEmail({
          to: email,
          subject: '🎓 Tu código de verificación - Foro-COAR',
          html: emailHtml,
        });
      } catch (emailError) {
        // Si falla el email, eliminar el usuario creado
        await User.deleteOne({ email: email.toLowerCase() });
        return res.status(500).json({ error: 'No se pudo enviar el correo de verificación. Verifica tu configuración SMTP.' });
      }

      res.json({
        message: 'Registro iniciado. Revisa tu correo institucional para obtener tu código de verificación.',
        email: email.toLowerCase()
      });
    }

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Verificación de correo con código OTP
router.post('/verify', requireDb, async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ error: 'Código y email son requeridos' });
    }

    // Buscar usuario por email y código OTP
    const user = await User.findOne({
      email: email.toLowerCase(),
      otpCode: code,
      otpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Marcar como verificado
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      message: 'Correo verificado exitosamente',
      verified: true,
      needsProfile: true
    });

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Completar perfil (después de verificación)
router.post('/complete-profile', requireDb, async (req, res) => {
  try {
    const { email, nombreCompleto, añoIngreso } = req.body;

    if (!email || !nombreCompleto || !añoIngreso) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), isVerified: true });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado o no verificado' });
    }

    if (añoIngreso < 2000 || añoIngreso > new Date().getFullYear()) {
      return res.status(400).json({ error: 'Año de ingreso inválido' });
    }

    // Actualizar perfil
    user.nombreCompleto = nombreCompleto.trim();
    user.añoIngreso = añoIngreso;
    user.ingresoColegio = añoIngreso;
    user.name = nombreCompleto.trim();
    await user.save();

    res.json({ 
      message: 'Perfil completado correctamente',
      user: {
        email: user.email,
        nombreCompleto: user.nombreCompleto,
        añoIngreso: user.añoIngreso,
        role: user.role,
        isVerified: user.isVerified,
      }
    });

  } catch (error) {
    console.error('Error al completar perfil:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login
router.post('/login', requireDb, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario con contraseña incluida
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si está verificado
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Debes verificar tu correo antes de iniciar sesión',
        needsVerification: true 
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si está baneado
    if (user.banned) {
      return res.status(403).json({ error: 'Usuario suspendido' });
    }

    // Guardar en sesión
    if (req.session) {
      (req.session as any).userId = user._id;
    }

    res.json({
      message: 'Inicio de sesión exitoso',
      user: {
        email: user.email,
        nombreCompleto: user.nombreCompleto,
        añoIngreso: user.añoIngreso,
        role: user.role,
        isVerified: user.isVerified,
        credits: user.credits,
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session?.destroy((err) => {
    if (err) {
      console.error('Error en logout:', err);
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ message: 'Sesión cerrada correctamente' });
  });
});

// Obtener usuario actual
router.get('/me', requireDb, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        email: user.email,
        nombreCompleto: user.nombreCompleto,
        name: user.nombreCompleto,
        añoIngreso: user.añoIngreso,
        ingresoColegio: user.ingresoColegio || user.añoIngreso,
        role: user.role,
        isVerified: user.isVerified,
        credits: user.credits,
        bio: user.bio,
        picture: user.picture,
      }
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
