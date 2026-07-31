import Alert from "../models/Alert.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/alerts
 *
 * Fetches all active alerts (used for guest view or national summary).
 */
export const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ isActive: true }).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    alerts: alerts.map(a => ({
      id: a._id,
      title: a.title,
      severity: a.severity,
      district: a.district,
      alertType: a.alertType,
      locationName: a.locationName,
      lat: a.location?.coordinates?.[1] ?? 0,
      lng: a.location?.coordinates?.[0] ?? 0,
      expectedHours: a.expectedHours,
      action: a.action,
      aiConfidence: a.aiConfidence,
      windSpeed: a.windSpeed,
      population: a.population,
      deployedTeams: a.deployedTeams,
      timestamp: a.createdAt,
    })),
  });
});

/**
 * PATCH /api/alerts/:id/resolve
 *
 * Marks an alert as inactive (resolved).
 */
export const resolveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alert = await Alert.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!alert) {
    throw new ApiError(404, "Alert not found");
  }

  // Import getIO dynamically to prevent circular dependencies if needed, or import at top
  // Actually, I'll import getIO at the top of the file in another chunk
  import("../services/socket.js")
    .then(({ getIO }) => {
      getIO().emit("alert_resolved", { alertId: id });
    })
    .catch(err => console.error(err));

  res.status(200).json({ success: true, message: "Alert resolved successfully" });
});

