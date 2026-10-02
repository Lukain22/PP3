const { Resend } = require('resend');

const DEFAULT_FROM = 'Sistema de Soporte <beth.t@example.com>';

const getClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const resolveFrom = () => {
  const from = String(process.env.MAIL_FROM || '').replace(/^["']|["']$/g, '').trim();
  if (from.includes('@')) return from;
  return DEFAULT_FROM;
};

exports.isMailConfigured = () => Boolean(process.env.RESEND_API_KEY);

exports.sendMail = async ({ to, subject, text, html }) => {
  const resend = getClient();

  if (!resend) {
    const error = new Error('Servicio de correo no configurado');
    error.code = 'MAIL_NOT_CONFIGURED';
    throw error;
  }

  const { data, error } = await resend.emails.send({
    from: resolveFrom(),
    to: [to],
    subject,
    html,
    text
  });

  if (error) {
    const sendError = new Error(error.message || 'No se pudo enviar el correo');
    sendError.code = error.name || 'MAIL_SEND_FAILED';
    throw sendError;
  }

  return data;
};
