const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const viewsRoutes = require('./routes/viewsRoutes');
const { initTicketsTable, initCommentsTable } = require('./controllers/ticketsController');
const { initTicketHistoryTable } = require('./utils/ticketHistory');
const { initAttachmentsTable } = require('./utils/attachments');
const { initSlaPoliciesTable, loadPolicies, buildIncidentSla, formatDateForDb } = require('./utils/sla');
const {
  initGroupsTable,
  initUserGroupsTable,
  initTicketResolutionsTable,
  getDefaultGroupId
} = require('./utils/groups');
const { initTicketViewsTable } = require('./controllers/viewsController');
const db = require('./db/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/admin', adminRoutes);
app.use('/technician', technicianRoutes);
app.use('/views', viewsRoutes);

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
        initAttachmentsTable();
        initSlaPoliciesTable();
        initGroupsTable();
        initUserGroupsTable();
        initTicketResolutionsTable();
        initTicketViewsTable();
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
  db.query('ALTER TABLE tickets ADD COLUMN sla_response_due TIMESTAMP NULL DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna sla_response_due:', err.code);
  });
  db.query('ALTER TABLE tickets ADD COLUMN sla_resolution_due TIMESTAMP NULL DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna sla_resolution_due:', err.code);
  });
  db.query('ALTER TABLE tickets ADD COLUMN sla_status VARCHAR(20) DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna sla_status:', err.code);
  });
  db.query('ALTER TABLE tickets ADD COLUMN sla_paused_at TIMESTAMP NULL DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna sla_paused_at:', err.code);
  });
  db.query('ALTER TABLE tickets ADD COLUMN group_id INT NULL DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna group_id:', err.code);
    assignDefaultGroupsToTickets();
  });
  db.query('ALTER TABLE tickets ADD COLUMN technician_id INT NULL DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando columna technician_id:', err.code);
  });
  db.query('ALTER TABLE tickets MODIFY COLUMN priority VARCHAR(50) DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando priority nullable:', err.code);
    backfillSlaData();
  });
};

const assignDefaultGroupsToTickets = () => {
  getDefaultGroupId((err, defaultId) => {
    if (err || !defaultId) return;
    db.query('UPDATE tickets SET group_id = ? WHERE group_id IS NULL', [defaultId], () => {});
  });
};

const backfillSlaData = () => {
  db.query(
    "UPDATE tickets SET priority = NULL, sla_response_due = NULL, sla_resolution_due = NULL, sla_status = NULL, sla_paused_at = NULL WHERE type = 'requirement'",
    (err) => {
      if (err) console.error('Error limpiando SLA de requerimientos:', err.code);
    }
  );

  loadPolicies((policyErr, policies) => {
    if (policyErr) return;

    db.query(
      "SELECT id, priority, created_at, status FROM tickets WHERE type = 'incident' AND sla_response_due IS NULL",
      (selErr, rows) => {
        if (selErr || !rows.length) return;

        rows.forEach((row) => {
          const sla = buildIncidentSla(
            { type: 'incident', priority: row.priority || 'medium', created_at: row.created_at, status: row.status },
            policies
          );
          db.query(
            'UPDATE tickets SET sla_response_due = ?, sla_resolution_due = ?, sla_status = ? WHERE id = ?',
            [
              formatDateForDb(sla.sla_response_due),
              formatDateForDb(sla.sla_resolution_due),
              sla.sla_status,
              row.id
            ],
            () => {}
          );
        });
      }
    );
  });
};

initUsersTable();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});