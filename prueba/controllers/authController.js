const crypto = require('crypto');
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendMail, isMailConfigured } = require('../utils/mailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_MINUTES = 60;
const GENERIC_RESET_MESSAGE =
  'Si el correo está registrado, te enviamos un enlace para restablecer la contraseña. Revisá también spam.';

const lastResetRequestByEmail = new Map();
const RESET_COOLDOWN_MS = 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const queryAsync = (sql, params) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const buildResetEmail = (resetUrl) => {
  const text = [
    'Recibimos un pedido para restablecer la contraseña del Sistema de Soporte Técnico.',
    '',
    `Este enlace vale ${RESET_TOKEN_MINUTES} minutos:`,
    resetUrl,
    '',
    'Si no pediste este cambio, ignorá este correo.'
  ].join('\n');

  const html = `
    <p>Recibimos un pedido para restablecer la contraseña del Sistema de Soporte Técnico.</p>
    <p><a href="${resetUrl}">Restablecer contraseña</a></p>
    <p>El enlace vale ${RESET_TOKEN_MINUTES} minutos. Si no pediste este cambio, ignorá este correo.</p>
  `;

  return { text, html };
};

exports.register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'El correo no es válido' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email.toLowerCase().trim(), hashedPassword],
      (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este correo ya está registrado' });
          }
          console.error('Error en registro:', err.code);
          return res.status(500).json({ message: 'Error al registrar el usuario' });
        }

        res.status(201).json({ message: 'Usuario registrado' });
      }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase().trim()],
    async (err, results) => {
      if (err) {
        console.error('Error en login:', err.code);
        return res.status(500).json({ message: 'Error interno del servidor' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
      }

      const user = results[0];

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, role: user.role || 'user' });
    }
  );
};

exports.forgotPassword = async (req, res) => {
  const email = String(req.body?.email || '')
    .toLowerCase()
    .trim();

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Ingresá un correo válido' });
  }

  const lastRequest = lastResetRequestByEmail.get(email);
  if (lastRequest && Date.now() - lastRequest < RESET_COOLDOWN_MS) {
    return res.json({ message: GENERIC_RESET_MESSAGE });
  }
  lastResetRequestByEmail.set(email, Date.now());

  if (!isMailConfigured()) {
    console.error('forgotPassword: RESEND_API_KEY no está configurada');
    return res.status(500).json({
      message: 'El envío de correo no está configurado. Pedile a un administrador que complete RESEND_API_KEY en el servidor.'
    });
  }

  try {
    const users = await queryAsync('SELECT id, email FROM users WHERE email = ?', [email]);

    if (!users.length) {
      return res.json({ message: GENERIC_RESET_MESSAGE });
    }

    const user = users[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);

    await queryAsync(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [user.id]
    );

    await queryAsync(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    const { text, html } = buildResetEmail(resetUrl);

    await sendMail({
      to: user.email,
      subject: 'Restablecer contraseña — Sistema de Soporte Técnico',
      text,
      html
    });

    return res.json({ message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    console.error('Error en forgotPassword:', error.code || error.message);
    return res.status(500).json({ message: 'No se pudo enviar el correo de restablecimiento' });
  }
};

exports.resetPassword = async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');

  if (!token) {
    return res.status(400).json({ message: 'El enlace no es válido' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const tokenHash = hashToken(token);
    const rows = await queryAsync(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'El enlace expiró o ya fue utilizado. Pedí uno nuevo.' });
    }

    const resetRow = rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await queryAsync('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, resetRow.user_id]);
    await queryAsync('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [resetRow.id]);
    await queryAsync(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [resetRow.user_id]
    );

    return res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
  } catch (error) {
    console.error('Error en resetPassword:', error.code || error.message);
    return res.status(500).json({ message: 'No se pudo actualizar la contraseña' });
  }
};
