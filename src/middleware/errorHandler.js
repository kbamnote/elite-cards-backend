const multer = require('multer');

// Global error handler middleware
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = undefined;

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose/Mongo duplicate key errors
  else if (err.code === 11000) {
    statusCode = 400;
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    message = fields.length
      ? `Duplicate value for field(s): ${fields.join(', ')}`
      : 'Duplicate key error';
    errors = [{ message: 'Duplicate key error', fields }];
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer errors
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the request';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      default:
        message = err.message || 'Upload error';
    }
  }

  // Log detailed errors in development
  if (!isProd) {
    console.error('ERROR:', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    });
  }

  // Consistent JSON error response
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    // Do not expose stack traces in production
    ...(!isProd ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;