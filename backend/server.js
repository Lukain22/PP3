// Variables de entorno
require('dotenv').config();

// Aplicación Express
const express = require('express');

// CORS
const cors = require('cors');

// Rutas de la API
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const viewsRoutes = require('./routes/viewsRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const solutionRoutes = require('./routes/solutionRoutes');

const app = express();

// CORS
app.use(cors());

// Cuerpo JSON
app.use(express.json());

// Montaje de las rutas
app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/admin', adminRoutes);
app.use('/technician', technicianRoutes);
app.use('/views', viewsRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/solutions', solutionRoutes);

// Inicialización de la base de datos
const { initDatabase } = require('./db/schema');
initDatabase();

// Arranque del servidor
const PORT = process.env.PORT || 3000;

const { startDueNotifications } = require('./utils/notifications');

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  startDueNotifications();
});
