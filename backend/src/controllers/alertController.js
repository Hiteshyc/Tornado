import { alertService } from "../services/alertService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** GET /api/alerts?severity=high */
export const getAlerts = asyncHandler(async (req, res) => {
  const { severity } = req.query;
  const alerts = await alertService.getAll({ severity });
  res.status(200).json({ count: alerts.length, alerts });
});

/** GET /api/alerts/:id */
export const getAlert = asyncHandler(async (req, res) => {
  const alert = await alertService.getById(req.params.id);
  res.status(200).json({ alert });
});

/** POST /api/alerts  (admin/authority only) */
export const createAlert = asyncHandler(async (req, res) => {
  const alert = await alertService.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ alert });
});

/** DELETE /api/alerts/:id  (soft-delete, admin only) */
export const deactivateAlert = asyncHandler(async (req, res) => {
  await alertService.deactivate(req.params.id);
  res.status(200).json({ message: "Alert deactivated successfully" });
});
