import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Guards internal-only routes (e.g. token issuance) so they can never be
 * called directly by a browser/client — only by the backend server itself,
 * which attaches this shared secret as a header.
 *
 * This route must NEVER be exposed publicly: anyone who can reach it with
 * a valid userId could mint a token for that user.
 */
export function internalOnly(req, res, next) {
  const providedSecret = req.headers["x-internal-secret"];

  if (!providedSecret || providedSecret !== env.internalApiSecret) {
    throw new ApiError(403, "Forbidden: internal route");
  }

  next();
}
