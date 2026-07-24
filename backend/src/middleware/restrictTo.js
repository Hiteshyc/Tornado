import { ApiError } from "../utils/ApiError.js";

/**
 * Restrict access to users whose role is in the allowed list.
 * Must be used after the `protect` middleware (which sets req.user).
 *
 * Usage: router.post("/", protect, restrictTo("admin"), createAlert)
 */
export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to perform this action")
      );
    }
    next();
  };
}
