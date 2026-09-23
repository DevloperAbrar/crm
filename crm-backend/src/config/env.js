require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'GOOGLE_CLIENT_ID'];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.warn(
      `[env] Warning: missing environment variables: ${missing.join(', ')}. Using defaults where possible.`
    );
  }
}

module.exports = {
  validateEnv,
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/campussafar_crm',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_me',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  STALE_LEAD_DAYS: Number(process.env.STALE_LEAD_DAYS) || 5,
  FRAUD_FAST_LOG_SECONDS: Number(process.env.FRAUD_FAST_LOG_SECONDS) || 10,
};