const db = require('../db/db');

const initPasswordResetTokensTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reset_token_hash (token_hash),
      INDEX idx_reset_user (user_id)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error('Error creando tabla password_reset_tokens:', err.code);
      return;
    }
    console.log('Tabla password_reset_tokens lista');
  });
};

module.exports = { initPasswordResetTokensTable };
