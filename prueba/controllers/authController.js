const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
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