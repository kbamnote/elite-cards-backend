const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
let sharp = null;
try {
  sharp = require('sharp');
} catch (_) {
  sharp = null; // sharp is optional; skip resize if not installed
}

const { uploadToS3, deleteFromS3 } = require('../config/s3');

function send(res, status, success, message, data = null, errors = null) {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (errors !== null) payload.errors = errors;
  return res.status(status).json(payload);
}

function mimeToExt(mimetype, originalname = '') {
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') return '.jpg';
  const ext = path.extname(originalname || '');
  return ext || '.jpg';
}

// 1) Upload image to S3 (optional resize if sharp is available)
async function uploadImage(req, res) {
  try {
    const file = req.file;
    if (!file) return send(res, 400, false, 'No file provided');

    // Prepare buffer from memory or disk
    let buffer = file.buffer
      ? file.buffer
      : file.path
      ? fs.readFileSync(file.path)
      : null;

    if (!buffer) return send(res, 400, false, 'Invalid file payload');

    // Optional resize via sharp (if available)
    if (sharp) {
      try {
        buffer = await sharp(buffer)
          .rotate()
          .resize({ width: 1024, height: 1024, fit: 'inside' })
          .toBuffer();
      } catch (e) {
        console.warn('sharp resize failed, using original buffer:', e.message);
      }
    }

    const ext = mimeToExt(file.mimetype, file.originalname);
    const unique = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const filename = `${unique}${ext}`;
    const folder = req.body?.folder || req.query?.folder || 'images';

    const uploadPayload = { ...file, originalname: filename, buffer };
    const result = await uploadToS3(uploadPayload, folder);

    return send(res, 201, true, 'Image uploaded', {
      key: result.key,
      url: result.url,
      eTag: result.eTag,
    });
  } catch (err) {
    console.error('uploadImage error:', err);
    return send(res, 500, false, 'Failed to upload image');
  }
}

// 2) Delete image from S3
async function deleteImage(req, res) {
  try {
    const key = req.body?.key || req.query?.key;
    if (!key) return send(res, 400, false, 'S3 key is required');

    await deleteFromS3(key);
    return send(res, 200, true, 'Image deleted', { key });
  } catch (err) {
    console.error('deleteImage error:', err);
    return send(res, 500, false, 'Failed to delete image');
  }
}

module.exports = {
  uploadImage,
  deleteImage,
};