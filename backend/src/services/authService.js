import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository.js";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { requestAccessToken } from "../utils/tokenClient.js";
import { generateRefreshToken } from "../utils/generateToken.js";
import { generateSalt } from "../utils/generateSalt.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import User from "../models/User.js";

/** Generate a unique human-readable user code e.g. "WS-A3K9X2" */
async function generateUserCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable chars (0,O,1,I)
  let code, exists;
  do {
    const random = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    code = `WS-${random}`;
    exists = await User.findOne({ userCode: code });
  } while (exists); // retry on collision (extremely rare)
  return code;
}

const BCRYPT_COST_FACTOR = env.bcryptCostFactor; // 12

// Derive refresh token TTL from env (e.g. "7d" → 7 * 24 * 60 * 60 * 1000 ms)
function parseExpiryMs(str) {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const value = parseInt(match[1], 10);
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * units[match[2]];
}

export const authService = {
  async register({ name, email, phone, password }) {
    // Step 1: Validate input — handled upstream by Joi middleware

    // Step 2: Check email exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists");
    }

    // Step 3: Generate salt (unique per user, seeded from name + email)
    const salt = generateSalt(name, email);

    // Step 4: Hash password (salt as pepper + bcrypt's own internal salt, cost factor 12)
    const passwordHash = await bcrypt.hash(password + salt, BCRYPT_COST_FACTOR);

    // Step 5: Store user
    const userCode = await generateUserCode();
    const user = await userRepository.create({
      name,
      email,
      phone,
      passwordHash,
      salt,
      userCode,
    });

    // Step 6: Issue access token
    const token = await requestAccessToken(user._id.toString(), user.role);

    // Step 7: Issue refresh token and persist hash to DB
    const { refreshToken, expiresAt } = await issueAndStoreRefreshToken(user._id);

    return { user: sanitizeUser(user), token, refreshToken };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, true);

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Check if account is currently locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.accountLockedUntil - new Date()) / (60 * 1000),
      );
      throw new ApiError(
        423,
        `Account is locked. Try again in ${minutesLeft} minute(s).`,
      );
    }

    const isMatch = await bcrypt.compare(
      password + user.salt,
      user.passwordHash,
    );

    if (!isMatch) {
      const updatedUser = await userRepository.incrementFailedAttempts(
        user._id,
      );

      if (updatedUser.failedLoginAttempts >= env.maxFailedLoginAttempts) {
        const lockUntil = new Date(
          Date.now() + env.accountLockDurationMinutes * 60 * 1000,
        );
        await userRepository.lockAccount(user._id, lockUntil);
        throw new ApiError(
          423,
          `Too many failed attempts. Account locked for ${env.accountLockDurationMinutes} minutes.`,
        );
      }

      throw new ApiError(401, "Invalid email or password");
    }

    // Successful login: reset attempts and update lastLogin
    await userRepository.resetLoginAttempts(user._id);

    // Issue access token
    const token = await requestAccessToken(user._id.toString(), user.role);

    // Issue refresh token: revoke any previous sessions, then persist new one
    const { refreshToken } = await issueAndStoreRefreshToken(user._id);

    return { user: sanitizeUser(user), token, refreshToken };
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Generate a signed refresh token JWT, revoke any existing tokens for the user,
 * and persist the hashed new token to the database.
 */
async function issueAndStoreRefreshToken(userId) {
  const rawRefreshToken = generateRefreshToken(userId.toString());
  const expiresAt = new Date(
    Date.now() + parseExpiryMs(env.jwtRefreshExpiresIn),
  );

  // Rotate: revoke all previous refresh tokens for this user
  await refreshTokenRepository.revokeByUserId(userId);

  // Store hashed token
  await refreshTokenRepository.create(userId, rawRefreshToken, expiresAt);

  return { refreshToken: rawRefreshToken, expiresAt };
}

/** Strip sensitive fields before sending user object back to client */
function sanitizeUser(user) {
  return {
    id: user._id,
    userCode: user.userCode,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    profileImage: user.profileImage,
    lastLogin: user.lastLogin,
  };
}
