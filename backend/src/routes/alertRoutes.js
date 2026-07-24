import { Router } from "express";
import {
  getAlerts,
  getAlert,
  createAlert,
  deactivateAlert,
} from "../controllers/alertController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/restrictTo.js";
import {
  validate,
  createAlertSchema,
} from "../validations/resourceValidation.js";

const router = Router();

// ── Public ─────────────────────────────────────────────────────
// GET /api/alerts          — list all active alerts (optional ?severity= filter)
// GET /api/alerts/:id      — get a single alert
router.get("/", getAlerts);
router.get("/:id", getAlert);

// ── Admin only ─────────────────────────────────────────────────
// POST   /api/alerts       — create a new alert
// DELETE /api/alerts/:id   — soft-delete an alert
router.post("/", protect, restrictTo("admin"), validate(createAlertSchema), createAlert);
router.delete("/:id", protect, restrictTo("admin"), deactivateAlert);

export default router;
