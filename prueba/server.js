const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const db = require('./db/db');
const { initUsersTable } = require('./controllers/authController');
const { initTicketsTable } = require('./controllers/ticketsController');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);

db.ready
  .then(() => {
    initUsersTable();
    initTicketsTable();
  })
  .catch((err) => {
    console.error('No se pudo inicializar la base de datos:', err);
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});