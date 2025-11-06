const multer = require('multer');

// Memory storage for direct upload to S3 (no temp files on disk)
const storage = multer.memoryStorage();

// Accept only common image types
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png) are allowed'));
};

// Limit file size to 5MB
const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });

// Error-handling wrapper for single-file uploads
function uploadSingle(fieldName = 'file') {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Max 5MB.' });
          }
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: err.message || 'Invalid file upload' });
      }
      next();
    });
  };
}

module.exports = { upload, uploadSingle };