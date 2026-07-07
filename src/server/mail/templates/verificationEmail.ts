const APP_NAME = 'Foro COAR';

export function buildVerificationEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de verificación - ${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f4;">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:0 auto;background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%);padding:40px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">Hola,</p>
              <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">
                ¡Bienvenido a <strong>${APP_NAME}</strong>! Estamos emocionados de que te unas a la comunidad estudiantil del COAR Cusco.
              </p>
              <p style="margin:0 0 25px 0;color:#374151;font-size:16px;line-height:1.6;">
                Para completar tu registro, ingresa el siguiente código de verificación:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:30px 0;">
                <tr>
                  <td style="background-color:#1e3a8a;padding:28px;text-align:center;border-radius:6px;">
                    <span style="color:#ffffff;font-size:40px;font-weight:700;letter-spacing:8px;font-family:'Courier New',monospace;">${code}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 30px 0;color:#6b7280;font-size:14px;text-align:center;">
                Este código expira en <strong>10 minutos</strong>.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:25px 0;background-color:#f3f4f6;border-left:4px solid #1e3a8a;border-radius:4px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.5;">
                      Si no creaste una cuenta en ${APP_NAME}, puedes ignorar este correo de forma segura.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:25px 30px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 10px 0;color:#6b7280;font-size:13px;line-height:1.5;">
                Este es un correo automático. No respondas a este mensaje.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 ${APP_NAME} - Comunidad Estudiantil</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
