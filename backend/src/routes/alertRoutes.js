import { Router } from "express";
import { getAlerts, getNearbyAlerts } from "../controllers/alertController.js";

const router = Router();

// GET /api/alerts — Public route to fetch all active alerts
router.get("/", getAlerts);

// GET /api/alerts/nearby — Public route to query alerts within a radius
router.get("/nearby", getNearbyAlerts);

export default router;
