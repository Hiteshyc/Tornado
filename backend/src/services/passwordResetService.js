import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { userRepository } from "../repositories/userRepository.js";
import { emailService } from "./emailService.js";
import { generateSalt } from "../utils/generateSalt.js";
import { requestAccessToken } from "../utils/tokenClient.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

/**
 * In-memory OTP store (no DB).
 * Key:   lowercase email string
 * Value: { otpHash: string, expiresAt: Date, attempts: number }
 *
 * Entries are deleted on:
 *  - successful verification (one-time use)
 *  - expiry detected during verification
 *  - max attempts exceeded
 *  - a new OTP is requested for the same email (overwrites previous)
 */
const otpStore = new Map();

const BCRYPT_OTP_ROUNDS = 8; // lower cost than passwords — OTPs are short-lived

export const passwordResetService = {
  // ─────────────────────────────────────────────────────────────
  // Step 1 — send OTP to email
  // ─────────────────────────────────────────────────────────────
  async forgotPassword(email) {
    const normalizedEmail = email.trim().toLowerCase();

    // Look up user — but do NOT reveal whether the account exists
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      // Return generic success to prevent email enumeration
      return {
        message:
          "If an account with that email exists, a code has been sent.",
      };
    }

    // Generate a cryptographically secure 6-digit OTP
    const otp = String(crypto.randomInt(100_000, 1_000_000)); // "000000"–"999999"

    // Hash before storing — raw OTP is never persisted anywhere
    const otpHash = await bcrypt.hash(otp, BCRYPT_OTP_ROUNDS);

    const expiresAt = new Date(
      Date.now() + env.otpExpiryMinutes * 60 * 1_000,
    );

    // Overwrite any previous pending OTP for this email
    otpStore.set(normalizedEmail, { otpHash, expiresAt, attempts: 0 });

    // Fire email (non-blocking failure — catch and re-throw with friendly message)
    await emailService.sendOtpEmail(normalizedEmail, otp);

    return {
      message: "If an account with that email exists, a code has been sent.",
    };
  },

  // ─────────────────────────────────────────────────────────────
  // Step 2 — verify OTP → return short-lived resetToken
  // ─────────────────────────────────────────────────────────────
  async verifyOtp(email, otp) {
    const normalizedEmail = email.trim().toLowerCase();
    const entry = otpStore.get(normalizedEmail);

    if (!entry) {
      throw new ApiError(400, "Invalid or expired code. Please request a new one.");
    }

    // Check expiry
    if (new Date() > entry.expiresAt) {
      otpStore.delete(normalizedEmail);
      throw new ApiError(400, "Code has expired. Please request a new one.");
    }

    // Rate-limit verification attempts
    if (entry.attempts >= env.otpMaxAttempts) {
      otpStore.delete(normalizedEmail);
      throw new ApiError(
        429,
        "Too many incorrect attempts. Please request a new code.",
      );
    }

    // Compare submitted OTP against stored hash
    const isMatch = await bcrypt.compare(otp, entry.otpHash);

    if (!isMatch) {
      // Persist incremented attempt count
      otpStore.set(normalizedEmail, {
        ...entry,
        attempts: entry.attempts + 1,
      });
      const remaining = env.otpMaxAttempts - (entry.attempts + 1);
      throw new ApiError(
        400,
        remaining > 0
          ? `Incorrect code. ${remaining} attempt(s) remaining.`
          : "Too many incorrect attempts. Please request a new code.",
      );
    }

    // ✅ OTP correct — delete immediately (one-time use)
    otpStore.delete(normalizedEmail);

    // Issue a short-lived resetToken JWT containing only the email
    const resetToken = jwt.sign(
      { email: normalizedEmail },
      env.jwtSecret,
      { expiresIn: "15m" },
    );

    return { resetToken };
  },

  // ─────────────────────────────────────────────────────────────
  // Step 3 — set new password using resetToken
  // ─────────────────────────────────────────────────────────────
  async resetPassword({ resetToken, newPassword }) {
    // Verify the resetToken JWT
    let payload;
    try {
      payload = jwt.verify(resetToken, env.jwtSecret);
    } catch {
      throw new ApiError(401, "Reset link is invalid or has expired. Please start over.");
    }

    const { email } = payload;

    // Fetch user (with password fields for update)
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw new ApiError(404, "Account not found.");
    }

    // Generate a fresh salt and hash the new password
    const newSalt = generateSalt(user.name, email);
    const newPasswordHash = await bcrypt.hash(
      newPassword + newSalt,
      env.bcryptCostFactor,
    );

    // Persist new password, reset lock state, update lastLogin
    await userRepository.updatePassword(user._id, newPasswordHash, newSalt);

    // Issue a full session access token — user is now logged in
    const token = await requestAccessToken(user._id.toString(), user.role);

    return {
      user: sanitizeUser(user),
      token,
    };
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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
