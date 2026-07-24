import { Router } from "express";
import { getUserProfile, completeOnboarding } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/user/:userId — protected route to fetch a user profile
router.get("/:userId", protect, getUserProfile);

// PATCH /api/user/onboarding — protected route to submit onboarding details
router.patch("/onboarding", protect, completeOnboarding);

export default router;
