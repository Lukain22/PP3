const db = require('../db/db');

const DEFAULT_GROUP = {
  name: 'Mesa de entrada',
  description: 'Grupo principal donde ingresan los tickets nuevos para derivación'
};

const initGroupsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS \`groups\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.log('Error creando tabla groups:', err);
      return;
    }
    console.log('Tabla groups lista');

    db.query('SELECT id FROM `groups` WHERE is_default = 1 LIMIT 1', (selErr, rows) => {
      if (selErr || rows.length > 0) return;
      db.query(
        'INSERT INTO `groups` (name, description, is_default) VALUES (?, ?, 1)',
        [DEFAULT_GROUP.name, DEFAULT_GROUP.description],
        () => console.log('Grupo principal creado')
      );
    });
  });
};

const initUserGroupsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS user_groups (
      user_id INT NOT NULL,
      group_id INT NOT NULL,
      PRIMARY KEY (user_id, group_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE
    )
  `;

  db.query(sql, (err) => {
    if (err) console.log('Error creando tabla user_groups:', err);
    else console.log('Tabla user_groups lista');
  });
};

const initTicketResolutionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS ticket_resolutions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      resolved_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    )
  `;

  db.query(sql, (err) => {
    if (err) console.log('Error creando tabla ticket_resolutions:', err);
    else console.log('Tabla ticket_resolutions lista');
  });
};

const getDefaultGroupId = (callback) => {
  db.query('SELECT id FROM `groups` WHERE is_default = 1 LIMIT 1', (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) return callback(new Error('No hay grupo principal configurado'));
    callback(null, rows[0].id);
  });
};

const getUserGroupIds = (userId, callback) => {
  db.query(
    'SELECT group_id FROM user_groups WHERE user_id = ?',
    [userId],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows.map((r) => r.group_id));
    }
  );
};

const userCanAccessTicket = (user, ticket, userGroupIds) => {
  if (!user || !ticket) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'technician') {
    return ticket.group_id != null && userGroupIds.includes(ticket.group_id);
  }
  return ticket.user_id === user.id;
};

module.exports = {
  initGroupsTable,
  initUserGroupsTable,
  initTicketResolutionsTable,
  getDefaultGroupId,
  getUserGroupIds,
  userCanAccessTicket
};
