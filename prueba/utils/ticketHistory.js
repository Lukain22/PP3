const db = require('../db/db');

const initTicketHistoryTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS ticket_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      user_id INT NOT NULL,
      action VARCHAR(50) NOT NULL DEFAULT 'updated',
      field_name VARCHAR(50) NULL,
      old_value TEXT NULL,
      new_value TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.log('Error creando tabla ticket_history:', err);
    } else {
      console.log('Tabla ticket_history lista');
    }
  });
};

const toStr = (val) => (val == null ? null : String(val));

const logTicketHistory = (ticketId, userId, action, fieldName, oldValue, newValue, callback) => {
  db.query(
    `INSERT INTO ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ticketId, userId, action, fieldName, toStr(oldValue), toStr(newValue)],
    callback || (() => {})
  );
};

const logFieldChanges = (ticketId, userId, oldTicket, updates) => {
  Object.entries(updates).forEach(([field, newVal]) => {
    if (!(field in oldTicket) && newVal === undefined) return;
    const oldVal = oldTicket[field];
    if (toStr(oldVal) !== toStr(newVal)) {
      logTicketHistory(ticketId, userId, 'updated', field, oldVal, newVal);
    }
  });
};

const logTicketCreated = (ticketId, userId, values) => {
  ['type', 'status', 'priority', 'title'].forEach((field) => {
    if (values[field] != null) {
      logTicketHistory(ticketId, userId, 'created', field, null, values[field]);
    }
  });
};

module.exports = {
  initTicketHistoryTable,
  logTicketHistory,
  logFieldChanges,
  logTicketCreated
};
