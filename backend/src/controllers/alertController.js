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

