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

/** POST /api/announcements  (admin/authority only) */
export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ announcement });
});

/** DELETE /api/announcements/:id  (admin only) */
export const deactivateAnnouncement = asyncHandler(async (req, res) => {
  await announcementService.deactivate(req.params.id);
  res.status(200).json({ message: "Announcement deactivated successfully" });
});
