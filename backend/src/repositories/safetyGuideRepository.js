import SafetyGuide from "../models/SafetyGuide.js";

export const safetyGuideRepository = {
  /** Get all active guides, sorted by display order */
  findAll() {
    return SafetyGuide.find({ isActive: true }).sort({ order: 1 });
  },

  findByKey(key) {
    return SafetyGuide.findOne({ key: key.toLowerCase(), isActive: true });
  },

  findById(id) {
    return SafetyGuide.findById(id);
  },
};
