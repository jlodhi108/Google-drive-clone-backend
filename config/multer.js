const multer = require('multer');

// Uploads are buffered in memory (req.file.buffer) and handed straight to
// services/s3Service.js — nothing touches local disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // You can add file type restrictions here if needed
    cb(null, true);
  }
});

module.exports = {
  upload
};
