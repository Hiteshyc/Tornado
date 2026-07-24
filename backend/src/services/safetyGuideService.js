import { safetyGuideRepository } from "../repositories/safetyGuideRepository.js";
import { ApiError } from "../utils/ApiError.js";

export const safetyGuideService = {
  async getAll() {
    return safetyGuideRepository.findAll();
  },

  async getByKey(key) {
    const guide = await safetyGuideRepository.findByKey(key);
    if (!guide) throw new ApiError(404, `Safety guide for '${key}' not found`);
    return guide;
  },

  async getById(id) {
    const guide = await safetyGuideRepository.findById(id);
    if (!guide || !guide.isActive) throw new ApiError(404, "Safety guide not found");
    return guide;
  },

  async create(data) {
    // Check for duplicate key
    const existing = await safetyGuideRepository.findByKey(data.key);
    if (existing) throw new ApiError(409, `A safety guide for '${data.key}' already exists`);
    return safetyGuideRepository.create(data);
  },

  async update(id, data) {
    const guide = await safetyGuideRepository.findById(id);
    if (!guide) throw new ApiError(404, "Safety guide not found");
    return safetyGuideRepository.update(id, data);
  },
};
