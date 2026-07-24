import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { requestAccessToken } from "../utils/tokenClient.js";
import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/ApiError.js";

export const refreshService = {
  async refreshAccessToken(rawRefreshToken) {
    if (!rawRefreshToken) {
      throw new ApiError(401, "No refresh token provided");
    }

    // Step 1: Verify JWT signature and expiry
    let payload;
    try {
      payload = jwt.verify(rawRefreshToken, jwtConfig.refreshToken.secret);
    } catch {
      throw new ApiError(401, "Session has expired. Please log in again.");
    }

    const userId = payload.id;

    // Step 2: Look up the hashed token in DB (also checks revoked + expiresAt)
    const storedToken = await refreshTokenRepository.findByHash(rawRefreshToken);
    if (!storedToken) {
      throw new ApiError(401, "Session has been revoked. Please log in again.");
    }

    // Step 3: Confirm the user still exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(401, "Account no longer exists.");
    }

    // Step 4: Issue a fresh access token
    const accessToken = await requestAccessToken(userId, user.role);

    return { accessToken };
  },
};
