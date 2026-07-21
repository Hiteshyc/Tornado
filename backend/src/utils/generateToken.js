import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

export function generateAccessToken(userId, role) {
  const payload = { id: userId };
  if (role !== undefined) payload.role = role;

  return jwt.sign(payload, jwtConfig.accessToken.secret, {
    expiresIn: jwtConfig.accessToken.expiresIn,
  });
}

export function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, jwtConfig.refreshToken.secret, {
    expiresIn: jwtConfig.refreshToken.expiresIn,
  });
}
