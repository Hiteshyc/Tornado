import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Computes the SHA-256 hash of the internal API secret so that
 * the raw secret is never sent in plaintext over HTTP headers.
 */
function getHashedSecret() {
  return crypto.createHash("sha256").update(env.internalApiSecret).digest("hex");
}

/**
 * Calls the server's own internal-only /api/internal/token/access route
 * to obtain a signed access token for a user. Used from authService
 * instead of calling generateAccessToken() directly in-process.
 */
export async function requestAccessToken(userId, role) {
  const response = await fetch(
    `${env.serverBaseUrl}/api/internal/token/access`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": getHashedSecret(),
      },
      body: JSON.stringify({ userId, role }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || "Failed to issue access token",
    );
  }

  return data.accessToken;
}

