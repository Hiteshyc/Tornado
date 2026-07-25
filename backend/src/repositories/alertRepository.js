import Alert from "../models/Alert.js";

export const alertRepository = {
  /** Get all active alerts, newest first */
  findAll({ severity } = {}) {
    const filter = { isActive: true };
    if (severity && severity !== "all") filter.severity = severity;
    return Alert.find(filter).sort({ createdAt: -1 });
  },

  findById(id) {
    return Alert.findById(id);
  },
};
