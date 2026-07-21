import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  mongoUri: process.env.MONGO_URI_LOGIN,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  bcryptCostFactor: Number(process.env.BCRYPT_COST_FACTOR) || 12,

  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",

  emailUser: process.env.EMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  emailFrom: process.env.EMAIL_FROM || "no-reply@yourapp.com",

  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 10,
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,

  // Base URL used by internal server-to-server calls (used by tokenClient)
  serverBaseUrl:
    process.env.SERVER_BASE_URL ||
    `http://localhost:${process.env.PORT || 5000}`,

  // Shared secret for internal-only routes. MUST be set in production.
  internalApiSecret: process.env.INTERNAL_API_SECRET || "dev-internal-secret",
  maxFailedLoginAttempts: Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5,
  accountLockDurationMinutes:
    Number(process.env.ACCOUNT_LOCK_DURATION_MINUTES) || 15,
};
