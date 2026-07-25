import { announcementService } from "../services/announcementService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** GET /api/announcements */
export const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await announcementService.getAll();
  res.status(200).json({ count: announcements.length, announcements });
});

/** GET /api/announcements/:id */
export const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getById(req.params.id);
  res.status(200).json({ announcement });
});

