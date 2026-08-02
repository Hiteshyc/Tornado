import { alertRepository } from "../repositories/alertRepository.js";
import { ApiError } from "../utils/ApiError.js";

export const alertService = {
  async getAll({ severity } = {}) {
    return alertRepository.findAll({ severity });
  },

  async getById(id) {
    const alert = await alertRepository.findById(id);
    if (!alert || alert.status === "resolved") {
      throw new ApiError(404, "Alert not found");
    }
    return alert;
  },
};
