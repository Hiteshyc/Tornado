import { announcementRepository } from "../repositories/announcementRepository.js";
import { ApiError } from "../utils/ApiError.js";

export const announcementService = {
  async getAll() {
    return announcementRepository.findAll();
  },

  async getById(id) {
    const announcement = await announcementRepository.findById(id);
    if (!announcement || !announcement.isActive) {
      throw new ApiError(404, "Announcement not found");
    }
    return announcement;
  },

  async create({ agency, badge, title, body, priority, userId }) {
    return announcementRepository.create({
      agency,
      badge: badge.toUpperCase(),
      title,
      body,
      priority,
      createdBy: userId,
    });
  },

  async deactivate(id) {
    const ann = await announcementRepository.findById(id);
    if (!ann) throw new ApiError(404, "Announcement not found");
    return announcementRepository.deactivate(id);
  },
};
