const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const {
  MAX_FILE_SIZE,
  MAX_FILES_PER_REQUEST,
  ensureTicketDir,
  isAllowedExtension
} = require('../utils/attachments');

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      const dir = ensureTicketDir(req.params.id);
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const storedName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, storedName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_REQUEST
  },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedExtension(file.originalname)) {
      return cb(new Error('Tipo de archivo no permitido'));
    }
    cb(null, true);
  }
});

module.exports = upload;
