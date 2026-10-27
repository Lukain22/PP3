const db = require('../../backend/db/db');
const { initTicketReadsTable } = require('../../backend/utils/ticketReads');

const initTicketsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      priority VARCHAR(50) DEFAULT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'incident',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      user_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.log('Error creando tabla tickets:', err);
    } else {
      console.log('Tabla tickets lista');
      db.query(
        'ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        () => {}
      );
      initTicketReadsTable();
    }
  });
};

const initCommentsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.log('Error creando tabla ticket_comments:', err);
    } else {
      console.log('Tabla ticket_comments lista');
    }
  });
};

const initTicketViewsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS ticket_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      scope VARCHAR(20) NOT NULL,
      visibility VARCHAR(20) NOT NULL DEFAULT 'personal',
      share_group_id INT NULL DEFAULT NULL,
      filters JSON NOT NULL,
      sort_by VARCHAR(50) NOT NULL DEFAULT 'date-desc',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (share_group_id) REFERENCES \`groups\`(id) ON DELETE SET NULL
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error('Error creando tabla ticket_views:', err.code);
      return;
    }
    console.log('Tabla ticket_views lista');

    const migrate = (statement, label, next) => {
      db.query(statement, (alterErr) => {
        if (alterErr && alterErr.errno !== 1060) {
          console.error(`Error migrando ${label} en ticket_views:`, alterErr.code);
        }
        next();
      });
    };

    migrate('ALTER TABLE ticket_views ADD COLUMN sort_order INT NOT NULL DEFAULT 0', 'sort_order', () =>
      migrate('ALTER TABLE ticket_views ADD COLUMN hidden TINYINT(1) NOT NULL DEFAULT 0', 'hidden', () =>
        migrate(
          'ALTER TABLE ticket_views ADD COLUMN audience VARCHAR(20) NULL DEFAULT NULL',
          'audience',
          () => {
            db.query(
              `CREATE TABLE IF NOT EXISTS ticket_view_groups (
                view_id INT NOT NULL,
                group_id INT NOT NULL,
                PRIMARY KEY (view_id, group_id),
                FOREIGN KEY (view_id) REFERENCES ticket_views(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE
              )`,
              (groupErr) => {
                if (groupErr) {
                  console.error('Error creando ticket_view_groups:', groupErr.code);
                  return;
                }
                db.query(
                  `INSERT IGNORE INTO ticket_view_groups (view_id, group_id)
                   SELECT v.id, v.share_group_id
                   FROM ticket_views v
                   JOIN \`groups\` g ON g.id = v.share_group_id
                   WHERE v.share_group_id IS NOT NULL`,
                  (backfillErr) => {
                    if (backfillErr) console.error('Error vinculando grupos de vistas:', backfillErr.code);
                  }
                );
              }
            );
          }
        )
      )
    );
  });

  db.query(
    `CREATE TABLE IF NOT EXISTS user_view_layout (
      user_id INT NOT NULL,
      item_key VARCHAR(80) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, item_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    (layoutErr) => {
      if (layoutErr) console.error('Error creando user_view_layout:', layoutErr.code);
    }
  );
};

module.exports = {
  initTicketsTable,
  initCommentsTable,
  initTicketViewsTable
};
