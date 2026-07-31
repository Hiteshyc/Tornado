import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to restrict access to specific roles.
 * Must be used AFTER the `protect` middleware which sets `req.user`.
 * 
 * @param {...string} roles - The roles allowed to access the route
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "Forbidden: You do not have the required role to access this resource")
      );
    }
    next();
  };
};
