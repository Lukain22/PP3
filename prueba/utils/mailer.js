const nodemailer = require('nodemailer');

const stripQuotes = (value) => String(value || '').replace(/^["']|["']$/g, '').trim();

const gmailUser = () => stripQuotes(process.env.GMAIL_USER).toLowerCase();

const gmailAppPassword = () => stripQuotes(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, '');

const getTransport = () => {
  const user = gmailUser();
  const pass = gmailAppPassword();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass }
  });
};

exports.isMailConfigured = () => Boolean(gmailUser() && gmailAppPassword());

exports.sendMail = async ({ to, subject, text, html }) => {
  const transport = getTransport();

  if (!transport) {
    const error = new Error('Servicio de correo no configurado');
    error.code = 'MAIL_NOT_CONFIGURED';
    throw error;
  }

  const user = gmailUser();
  const fromName = stripQuotes(process.env.MAIL_FROM_NAME) || 'Sistema de Soporte';

  return transport.sendMail({
    from: `"${fromName.replace(/"/g, '')}" <${user}>`,
    to,
    subject,
    text,
    html
  });
};
