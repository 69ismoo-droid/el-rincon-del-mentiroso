import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private resend: Resend;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject,
        html,
      });
      console.log(`Email enviado a ${to}`);
    } catch (error: any) {
      console.error('Error al enviar email:', error);
      console.error('Detalles del error:', {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
      });
      throw new Error(`No se pudo enviar el correo: ${error.message}`);
    }
  }

  generateOTPEmail(code: string, email: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificación - Foro-COAR</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0f172a;
            color: #e2e8f0;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
            border: 1px solid #334155;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.02em;
          }
          .content {
            padding: 40px 30px;
          }
          .welcome-text {
            font-size: 18px;
            margin-bottom: 30px;
            color: #cbd5e1;
          }
          .code-box {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 8px;
            padding: 20px 40px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .info-box {
            background: rgba(79, 70, 229, 0.1);
            border: 1px solid rgba(79, 70, 229, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-title {
            color: #a5b4fc;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .footer {
            background: rgba(30, 41, 59, 0.5);
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #94a3b8;
          }
          .emoji {
            font-size: 24px;
            margin-right: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Foro-COAR</h1>
          </div>
          
          <div class="content">
            <p class="welcome-text">
              <span class="emoji">👋</span>
              ¡Bienvenido a la comunidad estudiantil del COAR!
            </p>
            
            <p style="color: #cbd5e1; margin-bottom: 30px;">
              Para completar tu registro y acceder al foro, 
              ingresa el siguiente código de verificación:
            </p>
            
            <div class="code-box">
              ${code}
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; margin-top: 20px; text-align: center;">
              Este código expirará en 15 minutos.
            </p>
            
            <div class="info-box">
              <div class="info-title">🔒 Tu Privacidad es Nuestra Prioridad</div>
              <p style="margin: 0; font-size: 14px;">
                Tu nombre real solo se usará para verificar tu identidad internamente.
              </p>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
              Si no solicitaste este registro, puedes ignorar este correo.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 Foro-COAR - Comunidad COAR</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Plataforma segura para estudiantes
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
