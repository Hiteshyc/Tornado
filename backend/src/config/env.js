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

  maxFailedLoginAttempts: Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5,
  accountLockDurationMinutes:
    Number(process.env.ACCOUNT_LOCK_DURATION_MINUTES) || 15,
};
