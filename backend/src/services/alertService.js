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

  async create({ title, severity, locationName, location, lat, lng, expectedHours, action, userId }) {
    // Construct GeoJSON Point if lat/lng are provided, otherwise use location object
    const locationGeoJSON =
      lat !== undefined && lng !== undefined
        ? { type: "Point", coordinates: [lng, lat] }
        : location;

    return alertRepository.create({
      title,
      severity,
      locationName: locationName || (typeof location === "string" ? location : ""),
      location: locationGeoJSON,
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
