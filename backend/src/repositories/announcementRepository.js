import Announcement from "../models/Announcement.js";

export const announcementRepository = {
  /** Get all active announcements, newest first */
  findAll() {
    return Announcement.find({ isActive: true }).sort({ createdAt: -1 });
  },

  findById(id) {
    return Announcement.findById(id);
  },

  create(data) {
    return Announcement.create(data);
  },

  deactivate(id) {
    return Announcement.findByIdAndUpdate(id, { isActive: false }, { new: true });
  },

  update(id, data) {
    return Announcement.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },
};
