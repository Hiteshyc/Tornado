import { Router } from "express";
import { getUserProfile, completeOnboarding, updateUserProfile, getUserReports, updateProfileImage } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/upload.js";

const router = Router();

// GET /api/user/:userId — protected route to fetch a user profile
router.get("/:userId", protect, getUserProfile);

// PATCH /api/user/onboarding — protected route to submit onboarding details
router.patch("/onboarding", protect, completeOnboarding);

// PATCH /api/user/:userId/profile-image — protected route to upload profile image
router.patch("/:userId/profile-image", protect, upload.single("profileImage"), updateProfileImage);

// PATCH /api/user/:userId — protected route to update user profile details
router.patch("/:userId", protect, updateUserProfile);

// GET /api/user/:userId/reports — protected route to fetch user reports
router.get("/:userId/reports", protect, getUserReports);

export default router;
