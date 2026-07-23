import { env } from "./env.js";

export const jwtConfig = {
  accessToken: {
    secret: env.jwtSecret,
    expiresIn: env.jwtExpiresIn, // e.g. "15m"
  },
  refreshToken: {
    secret: env.jwtRefreshSecret,
    expiresIn: env.jwtRefreshExpiresIn, // e.g. "7d"
  },
};
