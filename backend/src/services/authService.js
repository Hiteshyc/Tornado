import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository.js";
import { generateToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const SALT_ROUNDS = 10;

export const authService = {
  async register({ name, email, phone, password }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await userRepository.create({
      name,
      email,
      phone,
      passwordHash,
    });

    const token = generateToken(user._id);

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
        (user.accountLockedUntil - new Date()) / (60 * 1000)
      );
      throw new ApiError(
        423,
        `Account is locked. Try again in ${minutesLeft} minute(s).`
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const updatedUser = await userRepository.incrementFailedAttempts(
        user._id
      );

      if (updatedUser.failedLoginAttempts >= env.maxFailedLoginAttempts) {
        const lockUntil = new Date(
          Date.now() + env.accountLockDurationMinutes * 60 * 1000
        );
        await userRepository.lockAccount(user._id, lockUntil);
        throw new ApiError(
          423,
          `Too many failed attempts. Account locked for ${env.accountLockDurationMinutes} minutes.`
        );
      }

      throw new ApiError(401, "Invalid email or password");
    }

    // Successful login: reset attempts and update lastLogin
    await userRepository.resetLoginAttempts(user._id);

    const token = generateToken(user._id);

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
