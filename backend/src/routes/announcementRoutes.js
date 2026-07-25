import { Router } from "express";
import {
  getAnnouncements,
  getAnnouncement,
} from "../controllers/announcementController.js";

const router = Router();

// ── Public ──────────────────────────────────────────────────────
router.get("/", getAnnouncements);
router.get("/:id", getAnnouncement);

export default router;

