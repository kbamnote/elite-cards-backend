const express = require('express');
const router = express.Router();

const {
  createCard,
  getMyCards,
  getCardById,
  updateCard,
  deleteCard,
  logScan,
  getCardAnalytics,
} = require('../controllers/cardController');
const { protect } = require('../middleware/auth');

// POST /api/cards - Create card (protected)
router.post('/', protect, createCard);

// GET /api/cards - Get my cards (protected)
router.get('/', protect, getMyCards);

// GET /api/cards/:cardId - Get card by ID (public)
router.get('/:cardId', getCardById);

// PUT /api/cards/:cardId - Update card (protected)
router.put('/:cardId', protect, updateCard);

// DELETE /api/cards/:cardId - Delete card (protected)
router.delete('/:cardId', protect, deleteCard);

// POST /api/cards/:cardId/scan - Log scan (public)
router.post('/:cardId/scan', logScan);

// GET /api/cards/:cardId/analytics - Get analytics (protected)
router.get('/:cardId/analytics', protect, getCardAnalytics);

module.exports = router;