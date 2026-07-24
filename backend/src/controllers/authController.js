import { authService } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json({ user, token });
});

export const logout = asyncHandler(async (req, res) => {
  // req.user is populated by protect middleware
  await authService.logout(req.user._id);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

