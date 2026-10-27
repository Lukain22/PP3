const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { MAX_FILE_SIZE } = require('../utils/attachments');
const { ensureSolutionDir } = require('../utils/solutions');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        cb(null, ensureSolutionDir(req.params.id));
      } catch (err) {
        cb(err);
      }
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    }
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) return cb(new Error('La imagen debe ser PNG, JPG, GIF, WEBP o BMP'));
    cb(null, true);
  }
});

module.exports = upload;
