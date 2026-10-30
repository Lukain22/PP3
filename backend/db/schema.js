const { initTicketReadsTable } = require('../utils/ticketReads');
const { initTicketHistoryTable } = require('../utils/ticketHistory');
const { initNotificationsTable } = require('../utils/notifications');
const { initAttachmentsTable } = require('../utils/attachments');
const { initSlaPoliciesTable, loadPolicies, buildIncidentSla, formatDateForDb } = require('../utils/sla');
const {
  initGroupsTable,
  initUserGroupsTable,
  initTicketResolutionsTable,
  getDefaultGroupId
} = require('../utils/groups');
const { initPasswordResetTokensTable } = require('../utils/passwordReset');
const { initRbac } = require('../rbac/service');
const { initSolutionsTables } = require('../utils/solutions');
const db = require('./db');

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

const initDatabase = () => {
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
    const migrateUserColumn = (statement, label, next) => {
      db.query(statement, (alterErr) => {
        if (alterErr && alterErr.errno !== 1060) {
          console.error(`Error migrando ${label}:`, alterErr.code);
        }
        next();
      });
    };

    migrateUserColumn("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'", 'role', () =>
      migrateUserColumn(
        "ALTER TABLE users ADD COLUMN ui_theme VARCHAR(10) NOT NULL DEFAULT 'light'",
        'ui_theme',
        () =>
          migrateUserColumn(
            "ALTER TABLE users ADD COLUMN ui_language VARCHAR(5) NOT NULL DEFAULT 'es'",
            'ui_language',
            () => {
              initTicketsTable();
              initCommentsTable();
              initTicketHistoryTable();
              initAttachmentsTable();
              initSlaPoliciesTable();
              initGroupsTable();
              initUserGroupsTable();
              initTicketResolutionsTable();
              initTicketViewsTable();
              initNotificationsTable();
              initPasswordResetTokensTable();
              initRbac();
              initSolutionsTables();
              runTicketMigrations();
            }
          )
      )
    );
  });
};

// 1826 = FK con ese nombre ya existe; 1061 = índice duplicado; 1022 = constraint duplicada.
// MariaDB 10.4 informa una FK ya creada como 1005 con "errno: 121" en el mensaje.
const IGNORABLE_FK_ERRNOS = new Set([1826, 1061, 1022]);

const FOREIGN_KEYS = [
  {
    name: 'fk_tickets_group_id',
    table: 'tickets',
    column: 'group_id',
    refTable: 'groups',
    refColumn: 'id',
    onDelete: 'SET NULL',
    orphanSql: `SELECT COUNT(*) AS orphans
      FROM tickets t
      LEFT JOIN \`groups\` g ON g.id = t.group_id
      WHERE t.group_id IS NOT NULL AND g.id IS NULL`
  },
  {
    name: 'fk_tickets_technician_id',
    table: 'tickets',
    column: 'technician_id',
    refTable: 'users',
    refColumn: 'id',
    onDelete: 'SET NULL',
    orphanSql: `SELECT COUNT(*) AS orphans
      FROM tickets t
      LEFT JOIN users u ON u.id = t.technician_id
      WHERE t.technician_id IS NOT NULL AND u.id IS NULL`
  },
  {
    name: 'fk_ticket_attachments_comment_id',
    table: 'ticket_attachments',
    column: 'comment_id',
    refTable: 'ticket_comments',
    refColumn: 'id',
    onDelete: 'CASCADE',
    orphanSql: `SELECT COUNT(*) AS orphans
      FROM ticket_attachments a
      LEFT JOIN ticket_comments c ON c.id = a.comment_id
      WHERE a.comment_id IS NOT NULL AND c.id IS NULL`
  },
  {
    name: 'fk_password_reset_tokens_user_id',
    table: 'password_reset_tokens',
    column: 'user_id',
    refTable: 'users',
    refColumn: 'id',
    onDelete: 'CASCADE',
    orphanSql: `SELECT COUNT(*) AS orphans
      FROM password_reset_tokens p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE u.id IS NULL`
  }
];

const addForeignKeyIfClean = ({ name, table, column, refTable, refColumn, onDelete, orphanSql }) => {
  db.query(
    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND (
         (TABLE_NAME = ? AND COLUMN_NAME = ?)
         OR (TABLE_NAME = ? AND COLUMN_NAME = ?)
       )`,
    [table, column, refTable, refColumn],
    (typeErr, typeRows) => {
      if (typeErr) {
        console.error(`Error leyendo tipos para ${name}:`, typeErr.code);
        return;
      }

      const child = typeRows.find((row) => row.COLUMN_NAME === column && row.TABLE_NAME === table);
      const parent = typeRows.find((row) => row.COLUMN_NAME === refColumn && row.TABLE_NAME === refTable);
      if (!child || !parent) {
        console.warn(`FK ${name} omitida: no está la columna ${table}.${column} o ${refTable}.${refColumn}`);
        return;
      }

      const childType = String(child.COLUMN_TYPE).toLowerCase();
      const parentType = String(parent.COLUMN_TYPE).toLowerCase();
      if (childType !== parentType) {
        console.warn(
          `FK ${name} omitida: tipos distintos (${table}.${column} ${child.COLUMN_TYPE} vs ${refTable}.${refColumn} ${parent.COLUMN_TYPE})`
        );
        return;
      }

      db.query(
        `SELECT CONSTRAINT_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
           AND REFERENCED_TABLE_NAME = ?
           AND REFERENCED_COLUMN_NAME = ?
         LIMIT 1`,
        [table, column, refTable, refColumn],
        (existsErr, existsRows) => {
          if (existsErr) {
            console.error(`Error leyendo FK ${name}:`, existsErr.code);
            return;
          }
          if (existsRows.length > 0) return;
          createForeignKey({ name, table, column, refTable, refColumn, onDelete, orphanSql });
        }
      );
    }
  );
};

const isDuplicateForeignKeyError = (err) =>
  IGNORABLE_FK_ERRNOS.has(err.errno) ||
  (err.errno === 1005 && /errno:\s*121|Duplicate key/i.test(err.sqlMessage || ''));

const createForeignKey = ({ name, table, column, refTable, refColumn, onDelete, orphanSql }) => {
  db.query(orphanSql, (orphanErr, orphanRows) => {
    if (orphanErr) {
      console.error(`Error contando huérfanos para ${name}:`, orphanErr.code);
      return;
    }

    const orphans = Number(orphanRows[0] && orphanRows[0].orphans) || 0;
    if (orphans > 0) {
      console.warn(
        `FK ${name} omitida: ${orphans} fila(s) huérfana(s) en ${table}.${column}. No se modificó ninguna fila.`
      );
      return;
    }

    db.query(
      `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${refTable}\`(\`${refColumn}\`) ON DELETE ${onDelete}`,
      (alterErr) => {
        if (alterErr && !isDuplicateForeignKeyError(alterErr)) {
          console.error(`Error creando FK ${name}:`, alterErr.sqlMessage || alterErr.code);
        }
      }
    );
  });
};

const runForeignKeyMigrations = () => {
  FOREIGN_KEYS.forEach(addForeignKeyIfClean);
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
  db.query('ALTER TABLE tickets MODIFY COLUMN description MEDIUMTEXT NOT NULL', (err) => {
    if (err) console.error('Error migrando description a MEDIUMTEXT:', err.code);
  });
  db.query('ALTER TABLE ticket_resolutions MODIFY COLUMN content MEDIUMTEXT NOT NULL', (err) => {
    if (err) console.error('Error migrando resolución a MEDIUMTEXT:', err.code);
  });
  db.query('ALTER TABLE ticket_comments MODIFY COLUMN content MEDIUMTEXT NOT NULL', (err) => {
    if (err) console.error('Error migrando comentarios a MEDIUMTEXT:', err.code);
  });
  db.query('ALTER TABLE tickets MODIFY COLUMN priority VARCHAR(50) DEFAULT NULL', (err) => {
    if (err && err.errno !== 1060) console.error('Error migrando priority nullable:', err.code);
    backfillSlaData();
  });
  runForeignKeyMigrations();
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
            {
              type: 'incident',
              priority: row.priority || 'medium',
              created_at: row.created_at,
              status: row.status
            },
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

module.exports = { initDatabase };
