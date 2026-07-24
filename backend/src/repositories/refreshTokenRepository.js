import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";

/**
 * Hash the raw refresh token with SHA-256 before storing.
 * Refresh tokens are long random strings — SHA-256 is sufficient
 * (unlike passwords, they don't need the slowness of bcrypt).
 */
function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export const refreshTokenRepository = {
  /**
   * Persist a new refresh token entry.
   * Always revoke previous tokens for the user first (call revokeByUserId).
   */
  create(userId, rawToken, expiresAt) {
    return RefreshToken.create({
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt,
    });
  },

  /**
   * Find a valid (non-revoked, non-expired) token record matching this raw token.
   */
  findByHash(rawToken) {
    return RefreshToken.findOne({
      tokenHash: hashToken(rawToken),
      revoked: false,
      expiresAt: { $gt: new Date() },
    });
  },

  /**
   * Revoke all active refresh tokens for a user (on logout or new login).
   */
  revokeByUserId(userId) {
    return RefreshToken.updateMany(
      { userId, revoked: false },
      { revoked: true },
    );
  },
};
