const fs = require('fs');
const path = require('path');
const db = require('../db/db');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'tickets');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 5;

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.txt', '.csv', '.pdf',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z'
]);

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed'
};

const initAttachmentsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS ticket_attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      user_id INT NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.error('Error creando tabla ticket_attachments:', err.code);
    } else {
      console.log('Tabla ticket_attachments lista');
    }
  });
};

const ensureTicketDir = (ticketId) => {
  const dir = path.join(UPLOAD_ROOT, String(ticketId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const isAllowedExtension = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
};

const getMimeType = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
};

const getStoredPath = (ticketId, storedName) =>
  path.join(UPLOAD_ROOT, String(ticketId), storedName);

module.exports = {
  UPLOAD_ROOT,
  MAX_FILE_SIZE,
  MAX_FILES_PER_REQUEST,
  ALLOWED_EXTENSIONS,
  initAttachmentsTable,
  ensureTicketDir,
  isAllowedExtension,
  getMimeType,
  getStoredPath
};
