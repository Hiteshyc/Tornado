import { Router } from "express";
import {
  getAlerts,
  getAlert,
} from "../controllers/alertController.js";

const router = Router();

// ── Public ─────────────────────────────────────────────────────
// GET /api/alerts          — list all active alerts (optional ?severity= filter)
// GET /api/alerts/:id      — get a single alert
router.get("/", getAlerts);
router.get("/:id", getAlert);

export default router;

