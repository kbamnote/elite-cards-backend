const User = require('../models/User');

function send(res, status, success, message, data = null, errors = null) {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (errors !== null) payload.errors = errors;
  return res.status(status).json(payload);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 1) Register: Create new user
async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body || {};

    const errors = [];
    if (!name || typeof name !== 'string') errors.push({ field: 'name', message: 'Name is required' });
    if (!email || !isValidEmail(email)) errors.push({ field: 'email', message: 'Valid email is required' });
    if (!password || typeof password !== 'string' || password.length < 6)
      errors.push({ field: 'password', message: 'Password must be at least 6 characters' });

    if (errors.length) return send(res, 400, false, 'Validation failed', null, errors);

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return send(res, 409, false, 'Email already in use');

    const user = new User({ name: name.trim(), email: normalizedEmail, password, phone });
    await user.save();

    return send(res, 201, true, 'User registered successfully', { user });
  } catch (err) {
    console.error('Register error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 2) Login: Email/password, return JWT
async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    const errors = [];
    if (!email || !isValidEmail(email)) errors.push({ field: 'email', message: 'Valid email is required' });
    if (!password) errors.push({ field: 'password', message: 'Password is required' });
    if (errors.length) return send(res, 400, false, 'Validation failed', null, errors);

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return send(res, 401, false, 'Invalid email or password');

    // Check if password comparison works correctly
    let match;
    try {
      match = await user.comparePassword(password);
    } catch (compareErr) {
      console.error('Password comparison error:', compareErr);
      return send(res, 500, false, 'Authentication error');
    }
    
    if (!match) return send(res, 401, false, 'Invalid email or password');

    let token;
    try {
      token = user.generateJWT();
    } catch (tokenErr) {
      console.error('Token generation error:', tokenErr);
      return send(res, 500, false, 'Authentication token error');
    }
    
    const safeUser = user.toJSON();

    return send(res, 200, true, 'Login successful', { token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 3) Get current user profile
async function getMe(req, res) {
  try {
    if (!req.user) return send(res, 401, false, 'Not authorized');
    return send(res, 200, true, 'User profile fetched', { user: req.user });
  } catch (err) {
    console.error('GetMe error:', err);
    return send(res, 500, false, 'Server error');
  }
}

// 4) Update user details
async function updateProfile(req, res) {
  try {
    if (!req.user) return send(res, 401, false, 'Not authorized');

    const { name, email, phone, password } = req.body || {};
    const updates = {};
    const errors = [];

    if (name !== undefined) {
      if (!name || typeof name !== 'string') errors.push({ field: 'name', message: 'Name must be a string' });
      else updates.name = name.trim();
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) errors.push({ field: 'email', message: 'Email is invalid' });
      else updates.email = String(email).toLowerCase().trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string') errors.push({ field: 'phone', message: 'Phone must be a string' });
      else updates.phone = phone;
    }

    if (password !== undefined) {
      if (!password || typeof password !== 'string' || password.length < 6)
        errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
      else updates.password = password; // pre-save hook will hash
    }

    if (errors.length) return send(res, 400, false, 'Validation failed', null, errors);

    // If email is changing, ensure uniqueness
    if (updates.email && updates.email !== req.user.email) {
      const exists = await User.findOne({ email: updates.email });
      if (exists) return send(res, 409, false, 'Email already in use');
    }

    // Apply updates and save
    Object.assign(req.user, updates);
    await req.user.save();

    return send(res, 200, true, 'Profile updated successfully', { user: req.user });
  } catch (err) {
    console.error('UpdateProfile error:', err);
    return send(res, 500, false, 'Server error');
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};