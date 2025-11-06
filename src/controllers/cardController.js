const Card = require('../models/Card');
const ScanLog = require('../models/ScanLog');

function send(res, status, success, message, data = null, errors = null) {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (errors !== null) payload.errors = errors;
  return res.status(status).json(payload);
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return ['http:', 'https:'].includes(u.protocol);
  } catch (_) {
    return false;
  }
}

function isHexColor(str) {
  return /^#?[0-9A-Fa-f]{6}$/.test(str || '');
}

function normalizeSocialLinks(links) {
  if (!links) return [];
  if (Array.isArray(links)) return links.map(String).map((s) => s.trim());
  if (typeof links === 'string') return links.split(',').map((s) => s.trim());
  return [];
}

// 1) Create new card
async function createCard(req, res) {
  try {
    if (!req.user) return send(res, 401, false, 'Not authorized');

    const {
      name,
      email,
      phone,
      company,
      designation,
      website,
      socialLinks,
      profileImage,
      backgroundColor,
      textColor,
      isActive,
    } = req.body || {};

    const errors = [];
    if (website && !isValidUrl(website)) errors.push({ field: 'website', message: 'Website must be a valid URL' });
    const social = normalizeSocialLinks(socialLinks);
    if (backgroundColor && !isHexColor(backgroundColor)) errors.push({ field: 'backgroundColor', message: 'Invalid hex color' });
    if (textColor && !isHexColor(textColor)) errors.push({ field: 'textColor', message: 'Invalid hex color' });
    if (errors.length) return send(res, 400, false, 'Validation failed', null, errors);

    const card = await Card.create({
      userId: req.user._id,
      name,
      email,
      phone,
      company,
      designation,
      website,
      socialLinks: social,
      profileImage,
      backgroundColor,
      textColor,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    });

    return send(res, 201, true, 'Card created successfully', { card });
  } catch (err) {
    console.error('createCard error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 2) Get all cards for logged-in user
async function getMyCards(req, res) {
  try {
    if (!req.user) return send(res, 401, false, 'Not authorized');
    const cards = await Card.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return send(res, 200, true, 'Cards fetched', { cards });
  } catch (err) {
    console.error('getMyCards error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 3) Get single card by public cardId
async function getCardById(req, res) {
  try {
    const { cardId } = req.params || {};
    if (!cardId) return send(res, 400, false, 'cardId is required');
    const card = await Card.findOne({ cardId });
    if (!card) return send(res, 404, false, 'Card not found');
    return send(res, 200, true, 'Card fetched', { card });
  } catch (err) {
    console.error('getCardById error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 4) Update card details (owner only)
async function updateCard(req, res) {
  try {
    if (!req.user) return send(res, 401, false, 'Not authorized');
    const { cardId } = req.params || {};
    if (!cardId) return send(res, 400, false, 'cardId is required');

    const card = await Card.findOne({ cardId, userId: req.user._id });
    if (!card) return send(res, 404, false, 'Card not found or not owned by user');

    const {
      name,
      email,
      phone,
      company,
      designation,
      website,
      socialLinks,
      profileImage,
      backgroundColor,
      textColor,
      isActive,
    } = req.body || {};

    const errors = [];
    if (website && !isValidUrl(website)) errors.push({ field: 'website', message: 'Website must be a valid URL' });
    const social = normalizeSocialLinks(socialLinks);
    if (backgroundColor && !isHexColor(backgroundColor)) errors.push({ field: 'backgroundColor', message: 'Invalid hex color' });
    if (textColor && !isHexColor(textColor)) errors.push({ field: 'textColor', message: 'Invalid hex color' });
    if (errors.length) return send(res, 400, false, 'Validation failed', null, errors);

    Object.assign(card, {
      name: name ?? card.name,
      email: email ?? card.email,
      phone: phone ?? card.phone,
      company: company ?? card.company,
      designation: designation ?? card.designation,
      website: website ?? card.website,
      socialLinks: socialLinks ? social : card.socialLinks,
      profileImage: profileImage ?? card.profileImage,
      backgroundColor: backgroundColor ?? card.backgroundColor,
      textColor: textColor ?? card.textColor,
      isActive: typeof isActive === 'boolean' ? isActive : card.isActive,
    });

    await card.save();
    return send(res, 200, true, 'Card updated successfully', { card });
  } catch (err) {
    console.error('updateCard error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 5) Delete card (owner only)
async function deleteCard(req, res) {
  try {
    if (!req.user) return send(res, 401, false, 'Not authorized');
    const { cardId } = req.params || {};
    if (!cardId) return send(res, 400, false, 'cardId is required');

    const card = await Card.findOne({ cardId, userId: req.user._id });
    if (!card) return send(res, 404, false, 'Card not found or not owned by user');

    await Card.deleteOne({ _id: card._id });
    return send(res, 200, true, 'Card deleted successfully');
  } catch (err) {
    console.error('deleteCard error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 6) Log when card is scanned
async function logScan(req, res) {
  try {
    const { cardId } = req.params || {};
    if (!cardId) return send(res, 400, false, 'cardId is required');

    const card = await Card.findOne({ cardId });
    if (!card) return send(res, 404, false, 'Card not found');

    const { latitude, longitude, device } = req.body || {};
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const log = await ScanLog.create({
      cardId: card._id,
      scannedBy: req.user ? req.user._id : undefined,
      location: {
        latitude: typeof latitude === 'number' ? latitude : undefined,
        longitude: typeof longitude === 'number' ? longitude : undefined,
      },
      device,
      ipAddress,
    });

    await Card.updateOne({ _id: card._id }, { $inc: { scanCount: 1 } });

    return send(res, 201, true, 'Scan logged', { log });
  } catch (err) {
    console.error('logScan error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 7) Get scan statistics
async function getCardAnalytics(req, res) {
  try {
    const { cardId } = req.params || {};
    if (!cardId) return send(res, 400, false, 'cardId is required');

    const card = await Card.findOne({ cardId });
    if (!card) return send(res, 404, false, 'Card not found');

    const totalScans = await ScanLog.countDocuments({ cardId: card._id });
    const recentScans = await ScanLog.find({ cardId: card._id }).sort({ timestamp: -1 }).limit(50);

    const daily = await ScanLog.aggregate([
      { $match: { cardId: card._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return send(res, 200, true, 'Analytics fetched', {
      totalScans,
      dailyBreakdown: daily,
      recentScans,
      scanCountField: card.scanCount,
    });
  } catch (err) {
    console.error('getCardAnalytics error:', err);
    return send(res, 500, false, 'Server error');
  }
}

module.exports = {
  createCard,
  getMyCards,
  getCardById,
  updateCard,
  deleteCard,
  logScan,
  getCardAnalytics,
};