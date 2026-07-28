import Announcement from "../models/Announcement.js";

export const announcementRepository = {
  /** Get all active announcements, newest first */
  findAll() {
    return Announcement.find({ isActive: true }).sort({ createdAt: -1 });
  },

  findById(id) {
    return Announcement.findById(id);
  },
};
