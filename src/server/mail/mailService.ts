import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { buildVerificationEmailHtml } from './templates/verificationEmail.js';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export class MailService {
  private transporter: Transporter | null;
  private fromAddress: string;

  constructor() {
    const smtpKey = process.env.BREVO_SMTP_KEY?.trim();
    const smtpUser = process.env.BREVO_SMTP_USER?.trim();
    const fromEmail = process.env.BREVO_FROM_EMAIL?.trim();
    const fromName = process.env.BREVO_FROM_NAME?.trim() || 'Foro COAR';

    this.fromAddress = fromEmail
      ? fromName
        ? `"${fromName}" <${fromEmail}>`
        : fromEmail
      : '';

    if (smtpKey && smtpUser && fromEmail) {
      this.transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST?.trim() || 'smtp-relay.brevo.com',
        port: Number(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpKey,
        },
      });
    } else {
      this.transporter = null;
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'BREVO_SMTP_KEY, BREVO_SMTP_USER y BREVO_FROM_EMAIL son obligatorias en producción'
        );
      }
      console.warn(
        '[mail] Brevo no configurado — los correos se simularán en consola (solo desarrollo)'
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      console.warn(`[mail dev] Simulado → ${to} | ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(`No se pudo enviar el correo: ${err.message ?? 'error desconocido'}`);
    }
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
