import { Router } from "express";
import { getAlerts, resolveAlert } from "../controllers/alertController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = Router();

// GET /api/alerts — Fetch all active alerts (Public)
router.get("/", getAlerts);

// PATCH /api/alerts/:id/resolve — Resolve an active alert (Officer only)
router.patch("/:id/resolve", protect, authorizeRoles("officer"), resolveAlert);

export default router;
