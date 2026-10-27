const db = require('../db/db');

const SEEN_SELECT =
  'CAST(EXISTS(SELECT 1 FROM ticket_reads r WHERE r.ticket_id = t.id AND r.user_id = ?) AS UNSIGNED) AS seen';

const markTicketRead = (userId, ticketId, done) => {
  db.query(
    'INSERT IGNORE INTO ticket_reads (user_id, ticket_id) VALUES (?, ?)',
    [userId, ticketId],
    (err) => {
      if (err) console.error('Error marcando ticket como visto:', err.code || err.message);
      if (done) done(err);
    }
  );
};

const markExistingTicketsRead = (userId, done) => {
  db.query(
    'INSERT IGNORE INTO ticket_reads (user_id, ticket_id) SELECT ?, id FROM tickets',
    [userId],
    (err) => {
      if (err) console.error('Error marcando historial como visto:', err.code || err.message);
      if (done) done(err);
    }
  );
};

const initTicketReadsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS ticket_reads (
      user_id INT NOT NULL,
      ticket_id INT NOT NULL,
      read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, ticket_id),
      KEY idx_ticket_reads_ticket (ticket_id),
      CONSTRAINT fk_ticket_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_ticket_reads_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error('Error creando tabla ticket_reads:', err.code || err.message);
      return;
    }
    console.log('Tabla ticket_reads lista');
    db.query('SELECT COUNT(*) AS total FROM ticket_reads', (countErr, rows) => {
      if (countErr || !rows[0] || Number(rows[0].total) > 0) return;
      db.query(
        'INSERT IGNORE INTO ticket_reads (user_id, ticket_id) SELECT u.id, t.id FROM users u CROSS JOIN tickets t',
        (fillErr) => {
          if (fillErr) console.error('Error inicializando lecturas:', fillErr.code || fillErr.message);
        }
      );
    });
  });
};

module.exports = {
  SEEN_SELECT,
  markTicketRead,
  markExistingTicketsRead,
  initTicketReadsTable
};
