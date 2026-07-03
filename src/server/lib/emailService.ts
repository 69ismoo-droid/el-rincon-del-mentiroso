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
        <title>Código de Verificación - Foro COAR</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; -webkit-font-smoothing: antialiased;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🎓 Foro COAR</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      👋 Hola,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      ¡Bienvenido a la comunidad estudiantil del COAR! Estamos emocionados de que te unas a nuestro foro.
                    </p>
                    
                    <p style="margin: 0 0 25px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      <strong>Recuerda:</strong> El foro es <strong>100% anónimo</strong>. Tu identidad real nunca será revelada públicamente.
                    </p>
                    
                    <p style="margin: 0 0 25px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Para completar tu registro, ingresa el siguiente código de verificación:
                    </p>
                    
                    <!-- Code Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                      <tr>
                        <td style="background-color: #1e3a8a; padding: 25px; text-align: center; border-radius: 6px;">
                          <span style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 6px; font-family: 'Courier New', monospace;">${code}</span>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 14px; text-align: center;">
                      ⏰ Este código expirará en 15 minutos
                    </p>
                    
                    <!-- Security Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background-color: #f3f4f6; border-left: 4px solid #1e3a8a; border-radius: 4px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 15px; font-weight: 600;">🔒 Tu Privacidad es Nuestra Prioridad</p>
                          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                            Tu nombre real solo se usará para verificar tu identidad internamente. Nunca será compartido con otros estudiantes.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Si no solicitaste este registro, puedes ignorar este correo de forma segura.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      Este es un correo automático generado para la comunidad estudiantil del COAR. No respondas a este mensaje.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © 2026 Foro COAR - Comunidad Estudiantil
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  generatePasswordResetEmail(code: string, email: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - Foro COAR</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; -webkit-font-smoothing: antialiased;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">🔄 Foro COAR</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      👋 Hola,
                    </p>
                    
                    <p style="margin: 0 0 25px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Foro COAR.
                    </p>
                    
                    <p style="margin: 0 0 25px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Si <strong>fuiste tú</strong> quien solicitó este cambio, usa el siguiente código para establecer tu nueva contraseña:
                    </p>
                    
                    <!-- Code Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                      <tr>
                        <td style="background-color: #1e3a8a; padding: 25px; text-align: center; border-radius: 6px;">
                          <span style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 6px; font-family: 'Courier New', monospace;">${code}</span>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 14px; text-align: center;">
                      ⏰ Este código expirará en 15 minutos
                    </p>
                    
                    <!-- Security Warning -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0 0 8px 0; color: #dc2626; font-size: 15px; font-weight: 600;">⚠️ Importante</p>
                          <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                            Si <strong>NO solicitaste</strong> restablecer tu contraseña, ignora este correo inmediatamente. Tu cuenta sigue segura y nadie ha accedido a ella.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Si tienes problemas o necesitas ayuda, contacta al administrador del foro.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      Este es un correo automático generado para la comunidad estudiantil del COAR. No respondas a este mensaje.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © 2026 Foro COAR - Comunidad Estudiantil
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
