const crypto = require('crypto');
const path = require('path');

// 1. Generate unique 8-character card ID (hex)
function generateCardId() {
  return crypto.randomBytes(4).toString('hex'); // 8 hex chars
}

// 2. Generate unique S3 filename, preserving extension
function generateFileName(originalName = '') {
  const ext = path.extname(originalName || '').toLowerCase();
  const random = crypto.randomBytes(6).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${random}${ext || ''}`;
}

// 3. Standard API response formatter
function formatResponse(success, message, data) {
  const resp = { success: Boolean(success), message: message || '' };
  if (data !== undefined) resp.data = data;
  return resp;
}

// 4. Async route wrapper to forward errors to Express
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// 5. Export all helpers
module.exports = {
  generateCardId,
  generateFileName,
  formatResponse,
  asyncHandler,
};