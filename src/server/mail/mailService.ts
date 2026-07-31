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
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = process.env.SMTP_PORT?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const emailFrom = process.env.EMAIL_FROM?.trim();

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
      console.warn(
        '[mail] SMTP no configurado — los correos se simularán en consola'
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
