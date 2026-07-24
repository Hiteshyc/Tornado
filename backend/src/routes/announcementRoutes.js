import { Router } from "express";
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  deactivateAnnouncement,
} from "../controllers/announcementController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/restrictTo.js";
import {
  validate,
  createAnnouncementSchema,
} from "../validations/resourceValidation.js";

const router = Router();

// ── Public ──────────────────────────────────────────────────────
router.get("/", getAnnouncements);
router.get("/:id", getAnnouncement);

// ── Admin only ──────────────────────────────────────────────────
router.post(
  "/",
  protect,
  restrictTo("admin"),
  validate(createAnnouncementSchema),
  createAnnouncement
);
router.delete("/:id", protect, restrictTo("admin"), deactivateAnnouncement);

export default router;
