import { Router } from "express";
import { register, login, logout } from "../controllers/authController.js";
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/passwordResetController.js";
import { refresh } from "../controllers/refreshController.js";
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "../validations/authValidation.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);

router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
