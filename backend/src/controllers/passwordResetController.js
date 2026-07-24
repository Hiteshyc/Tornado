import { passwordResetService } from "../services/passwordResetService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await passwordResetService.forgotPassword(email);
  res.status(200).json(result);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await passwordResetService.verifyOtp(email, otp);
  res.status(200).json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;
  const result = await passwordResetService.resetPassword({
    resetToken,
    newPassword,
  });
  res.status(200).json(result);
});
