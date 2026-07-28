import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await userRepository.findById(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Access token expired, try refresh token below
    }
  }

  // Fallback to refresh token if present
  if (req.cookies?.refreshToken) {
    try {
      const decoded = jwt.verify(req.cookies.refreshToken, env.jwtRefreshSecret);
      const user = await userRepository.findById(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Refresh token expired or invalid
    }
  }

  throw new ApiError(401, "Not authorized, token invalid or expired");
});

// Optional version — attaches req.user if a valid token exists,
// but allows the request through even if unauthenticated (for guest access)
export const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await userRepository.findById(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Access token expired or invalid, fall through to refresh token
    }
  }

  // Fallback to 7-day refresh token cookie if access token is missing or expired
  if (req.cookies?.refreshToken) {
    try {
      const decoded = jwt.verify(req.cookies.refreshToken, env.jwtRefreshSecret);
      const user = await userRepository.findById(decoded.id);
      if (user) req.user = user;
    } catch {
      // Invalid or expired refresh token — treat as guest
    }
  }

  next();
});
