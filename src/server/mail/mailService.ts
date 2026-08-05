import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { buildVerificationEmailHtml } from './templates/verificationEmail.js';
import { logger } from '../lib/logger.js';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export class MailService {
  private transporter: Transporter | null;
  private fromAddress: string;
  private apiKey: string | null;

  constructor() {
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = process.env.SMTP_PORT?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const emailFrom = process.env.EMAIL_FROM?.trim();
    this.apiKey = process.env.BREVO_API_KEY?.trim() || null;

    this.fromAddress = emailFrom || '';

    if (smtpHost && smtpPort && smtpUser && smtpPass && emailFrom) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: false, // TLS para puerto 587
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      this.transporter = null;
    }

    if (!this.transporter && !this.apiKey) {
      console.warn(
        '[mail] Ni SMTP ni API de Brevo configurados — los correos se simularán en consola'
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null || this.apiKey !== null;
  }

  async sendMailViaAPI({ to, subject, html }: SendMailOptions): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API Key de Brevo no configurada');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Foro COAR',
          email: this.fromAddress || 'noreply@coar.cusco.edu.pe',
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
  }

  async sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
    // Prioridad: API de Brevo > SMTP > Simulación
    if (this.apiKey) {
      try {
        await this.sendMailViaAPI({ to, subject, html });
        logger.info('Correo enviado vía API de Brevo', { to, subject });
        return;
      } catch (error) {
        logger.error('Error al enviar correo vía API de Brevo, intentando SMTP', { error });
        // Si falla la API, intentar con SMTP si está disponible
      }
    }

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          html,
        });
        logger.info('Correo enviado vía SMTP', { to, subject });
        return;
      } catch (error: unknown) {
        logger.error('ERROR REAL DE BREVO AL ENVIAR CORREO (SMTP)', { error });
        const err = error as { message?: string };
        throw new Error(`No se pudo enviar el correo: ${err.message ?? 'error desconocido'}`);
      }
    }

    // Si ni API ni SMTP están disponibles, simular
    console.warn(`[mail dev] Simulado → ${to} | ${subject}`);
  }

  async sendVerificationCode(to: string, code: string, isResend = false): Promise<void> {
    const subject = isResend
      ? 'Nuevo código de verificación - Foro COAR'
      : 'Código de verificación para tu cuenta - Foro COAR';

    await this.sendMail({
      to,
      subject,
      html: buildVerificationEmailHtml(code),
    });
  }
}

export const mailService = new MailService();
