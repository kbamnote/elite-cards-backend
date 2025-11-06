const { body } = require('express-validator');
const { validationResult } = require('express-validator');

// Common handler to return consistent validation errors
const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

// Utils
const urlOpts = {
  protocols: ['http', 'https'],
  require_protocol: true,
  allow_underscores: true,
};

// 1. Validate registration input
const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ nullable: true }).trim().isMobilePhone('any').withMessage('Invalid phone number'),
  handleValidation,
];

// 2. Validate login input
const validateLogin = [
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

// 3. Validate card creation/update
const validateCard = [
  body('firstName').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('First name too long'),
  body('lastName').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Last name too long'),
  body('title').optional({ nullable: true }).trim().isLength({ max: 150 }).withMessage('Title too long'),
  body('company').optional({ nullable: true }).trim().isLength({ max: 150 }).withMessage('Company too long'),
  body('email').optional({ nullable: true }).trim().normalizeEmail().isEmail().withMessage('Invalid email'),
  body('phone').optional({ nullable: true }).trim().isMobilePhone('any').withMessage('Invalid phone number'),
  body('website').optional({ nullable: true }).isURL(urlOpts).withMessage('Invalid website URL'),
  body('socialLinks').optional({ nullable: true }).isArray().withMessage('socialLinks must be an array'),
  body('socialLinks.*').optional({ nullable: true }).isURL(urlOpts).withMessage('Invalid social link URL'),
  body('profileImage').optional({ nullable: true }).isURL(urlOpts).withMessage('Invalid profile image URL'),
  body('backgroundColor')
    .optional({ nullable: true })
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Invalid hex color for backgroundColor'),
  body('textColor')
    .optional({ nullable: true })
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Invalid hex color for textColor'),
  body('isActive').optional({ nullable: true }).isBoolean().withMessage('isActive must be boolean'),
  handleValidation,
];

// 4. Email format validation
const validateEmail = [
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
  handleValidation,
];

// 5. Phone number validation
const validatePhone = [
  body('phone').trim().isMobilePhone('any').withMessage('Invalid phone number'),
  handleValidation,
];

// 6. Export all validators
module.exports = {
  validateRegister,
  validateLogin,
  validateCard,
  validateEmail,
  validatePhone,
  handleValidation,
};