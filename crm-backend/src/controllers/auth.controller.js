const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
} = require('../config/env');

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function signTokens(user) {
  const accessToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

function toSafeUser(user) {
  const safe = user.toObject();
  delete safe.passwordHash;
  return safe;
}

// ---------------------------------------------------------------------------
// Admin (founder) login: email + password. Founder only.
// ---------------------------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required', 422);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive || !user.passwordHash) {
      return error(res, 'Invalid credentials', 401);
    }

    if (user.role !== 'founder') {
      return error(
        res,
        'Password login is for admins only. Team Leads and BDEs please use "Sign in with Google".',
        403
      );
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return error(res, 'Invalid credentials', 401);

    const tokens = signTokens(user);
    return success(res, { user: toSafeUser(user), ...tokens }, 'Logged in successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ---------------------------------------------------------------------------
// Team Lead / BDE login: Google. Only emails already created by the admin.
// ---------------------------------------------------------------------------
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return error(res, 'Google credential is required', 400);
    if (!GOOGLE_CLIENT_ID) return error(res, 'Google login is not configured on the server', 500);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      return error(res, 'Invalid Google token', 401);
    }

    if (!payload?.email || !payload.email_verified) {
      return error(res, 'Your Google email is not verified', 401);
    }

    const user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      return error(
        res,
        'No account found for this Google email. Please ask your admin to add you first.',
        403
      );
    }

    if (user.role === 'founder') {
      return error(res, 'Admins must sign in using the Admin Login (email & password).', 403);
    }

    if (!user.isActive) {
      return error(res, 'Your account has been deactivated. Please contact your admin.', 403);
    }

    // Bind the Google account on first login; reject if a different one shows up later.
    if (!user.googleId) {
      user.googleId = payload.sub;
    } else if (user.googleId !== payload.sub) {
      return error(res, 'This account is linked to a different Google account', 403);
    }
    if (payload.picture) user.avatar = payload.picture;
    await user.save();

    const tokens = signTokens(user);
    return success(res, { user: toSafeUser(user), ...tokens }, 'Logged in successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'refreshToken is required', 400);

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return error(res, 'User not found or inactive', 401);

    const tokens = signTokens(user);
    return success(res, tokens, 'Token refreshed');
  } catch (err) {
    return error(res, 'Invalid refresh token: ' + err.message, 401);
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeenAt: new Date() });
    }
    return success(res, null, 'Logged out');
  } catch (err) {
    return error(res, err.message, 500);
  }
};