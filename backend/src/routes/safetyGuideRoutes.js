import { Router } from "express";
import {
  getSafetyGuides,
  getSafetyGuideByKey,
  getSafetyGuide,
  createSafetyGuide,
  updateSafetyGuide,
} from "../controllers/safetyGuideController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/restrictTo.js";
import {
  validate,
  createSafetyGuideSchema,
} from "../validations/resourceValidation.js";

const router = Router();

// ── Public ──────────────────────────────────────────────────────
// GET /api/safety-guides              — all guides (for the grid)
// GET /api/safety-guides/key/:key     — by slug (for the drawer)
// GET /api/safety-guides/:id          — by id
router.get("/", getSafetyGuides);
router.get("/key/:key", getSafetyGuideByKey); // must come before /:id
router.get("/:id", getSafetyGuide);

// ── Admin only ──────────────────────────────────────────────────
router.post(
  "/",
  protect,
  restrictTo("admin"),
  validate(createSafetyGuideSchema),
  createSafetyGuide
);
router.patch("/:id", protect, restrictTo("admin"), updateSafetyGuide);

export default router;
