import { Router } from "express";
import { getUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/user/:userId — protected route to fetch a user profile
router.get("/:userId", protect, getUserProfile);

export default router;
