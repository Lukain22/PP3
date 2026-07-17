const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { initTicketsTable, initCommentsTable } = require('./controllers/ticketsController');
const { initTicketHistoryTable } = require('./utils/ticketHistory');
const db = require('./db/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/admin', adminRoutes);

const initUsersTable = () => {
  const createSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(createSql, (err) => {
    if (err) {
      console.error('Error creando tabla users:', err.code);
      return;
    }
    console.log('Tabla users lista');

    // Migración: agrega columna role si la tabla ya existía sin ella
    db.query(
      "ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'",
      (alterErr) => {
        if (alterErr && alterErr.errno !== 1060) {
          console.error('Error migrando columna role:', alterErr.code);
        }
        initTicketsTable();
        initCommentsTable();
        initTicketHistoryTable();
        runTicketMigrations();
      }
    );
  });
};

const runTicketMigrations = () => {
  // errno 1060 = columna ya existe, se ignora
  db.query('ALTER TABLE tickets ADD COLUMN category VARCHAR(100) DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna category:', err.code);
  });
  db.query('ALTER TABLE tickets ADD COLUMN subcategory VARCHAR(100) DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna subcategory:', err.code);
  });
  db.query("ALTER TABLE tickets ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'incident'", (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna type:', err.code);
  });
};

initUsersTable();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});