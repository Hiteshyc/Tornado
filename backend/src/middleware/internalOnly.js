import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Computes expected SHA-256 hash digest of the shared internal API secret.
 */
function getExpectedHashedSecret() {
  return crypto.createHash("sha256").update(env.internalApiSecret).digest("hex");
}

/**
 * Guards internal-only routes (e.g. token issuance) so they can never be
 * called directly by a browser/client — only by the backend server itself,
 * which attaches a SHA-256 hashed secret as a header.
 *
 * This route must NEVER be exposed publicly: anyone who can reach it with
 * a valid userId could mint a token for that user.
 */
export function internalOnly(req, res, next) {
  const providedSecret = req.headers["x-internal-secret"];
  const expectedSecret = getExpectedHashedSecret();

  if (
    !providedSecret ||
    providedSecret.length !== expectedSecret.length ||
    !crypto.timingSafeEqual(
      Buffer.from(providedSecret),
      Buffer.from(expectedSecret),
    )
  ) {
    throw new ApiError(403, "Forbidden: internal route");
  }

  next();
}

