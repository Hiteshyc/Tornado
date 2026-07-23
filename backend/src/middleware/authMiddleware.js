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

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await userRepository.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, "Not authorized, user no longer exists");
  }

  req.user = user;
  next();
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
      if (user) req.user = user;
    } catch {
      // Invalid or expired token — treat as guest, continue without error
    }
  }

  next();
});
