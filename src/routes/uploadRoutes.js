const express = require('express');
const router = express.Router();

const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// POST /api/upload/image - Upload image (protected)
router.post('/image', protect, uploadSingle('image'), uploadImage);

// DELETE /api/upload/image - Delete image (protected)
router.delete('/image', protect, deleteImage);

module.exports = router;