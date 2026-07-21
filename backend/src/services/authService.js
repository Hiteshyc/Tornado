import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository.js";
import { generateAccessToken } from "../utils/generateToken.js";
import { generateSalt } from "../utils/generateSalt.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const BCRYPT_COST_FACTOR = env.bcryptCostFactor; // 12

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
    const user = await userRepository.create({
      name,
      email,
      phone,
      passwordHash,
      salt,
    });

    // Step 6: Return success
    const token = generateAccessToken(user._id);

    return { user: sanitizeUser(user), token };
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

    const token = generateAccessToken(user._id);

    return { user: sanitizeUser(user), token };
  },
};

// Strip sensitive fields before sending user object back to client
function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    profileImage: user.profileImage,
    lastLogin: user.lastLogin,
  };
}
