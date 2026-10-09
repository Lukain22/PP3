const db = require('../db/db');

const initSolutionsTables = () => {
  db.query(
    `CREATE TABLE IF NOT EXISTS solutions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content MEDIUMTEXT NOT NULL,
      category VARCHAR(100) DEFAULT NULL,
      subcategory VARCHAR(100) DEFAULT NULL,
      tags VARCHAR(500) DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      share_all TINYINT(1) NOT NULL DEFAULT 0,
      use_count INT NOT NULL DEFAULT 0,
      created_by INT NOT NULL,
      updated_by INT DEFAULT NULL,
      approved_by INT DEFAULT NULL,
      approved_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error('Error creando tabla solutions:', err.code);
        return;
      }
      console.log('Tabla solutions lista');
      db.query(
        `CREATE TABLE IF NOT EXISTS solution_groups (
          solution_id INT NOT NULL,
          group_id INT NOT NULL,
          PRIMARY KEY (solution_id, group_id),
          FOREIGN KEY (solution_id) REFERENCES solutions(id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE
        )`,
        (groupErr) => {
          if (groupErr) console.error('Error creando tabla solution_groups:', groupErr.code);
          else console.log('Tabla solution_groups lista');
        }
      );
      db.query(
        `CREATE TABLE IF NOT EXISTS solution_uses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          solution_id INT NOT NULL,
          ticket_id INT NOT NULL,
          user_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (solution_id) REFERENCES solutions(id) ON DELETE CASCADE,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        (useErr) => {
          if (useErr) console.error('Error creando tabla solution_uses:', useErr.code);
          else console.log('Tabla solution_uses lista');
        }
      );
    }
  );
};

module.exports = { initSolutionsTables };
