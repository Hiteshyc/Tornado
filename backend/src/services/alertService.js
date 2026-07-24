import { alertRepository } from "../repositories/alertRepository.js";
import { ApiError } from "../utils/ApiError.js";

export const alertService = {
  async getAll({ severity } = {}) {
    return alertRepository.findAll({ severity });
  },

  async getById(id) {
    const alert = await alertRepository.findById(id);
    if (!alert || !alert.isActive) {
      throw new ApiError(404, "Alert not found");
    }
    return alert;
  },

  async create({ title, severity, location, lat, lng, expectedHours, action, userId }) {
    return alertRepository.create({
      title,
      severity,
      location,
      coordinates: {
        type: "Point",
        coordinates: [lng, lat], // GeoJSON order: [lng, lat]
      },
      expectedHours,
      action,
      createdBy: userId,
    });
  },

  async deactivate(id) {
    const alert = await alertRepository.findById(id);
    if (!alert) throw new ApiError(404, "Alert not found");
    return alertRepository.deactivate(id);
  },
};
