import { Router } from "express";
import {
  getSafetyGuides,
  getSafetyGuideByKey,
  getSafetyGuide,
} from "../controllers/safetyGuideController.js";

const router = Router();

// ── Public ──────────────────────────────────────────────────────
// GET /api/safety-guides              — all guides (for the grid)
// GET /api/safety-guides/key/:key     — by slug (for the drawer)
// GET /api/safety-guides/:id          — by id
router.get("/", getSafetyGuides);
router.get("/key/:key", getSafetyGuideByKey); // must come before /:id
router.get("/:id", getSafetyGuide);

export default router;

