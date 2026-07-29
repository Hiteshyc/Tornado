import { Router } from "express";
import { getAlerts } from "../controllers/alertController.js";

const router = Router();

// GET /api/alerts — Public route to fetch all active alerts
router.get("/", getAlerts);

export default router;
