import Alert from "../models/Alert.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/alerts
 *
 * Fetches all active alerts (used for guest view or national summary).
 */
export const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ status: { $ne: "resolved" } }).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    alerts: alerts.map(a => ({
      id: a._id,
      title: a.title,
      severity: a.severity,
      hazardType: a.hazardType,
      confidence: a.confidence,
      status: a.status,
      eta: a.eta,
      affectedHubs: a.affectedHubs,
      reportId: a.reportId,
      reportUrl: a.reportUrl,
      deploymentStatus: a.deploymentStatus,
      deployedTeams: a.deployedTeams?.length || 0,
      action: a.action,
      createdByAI: a.createdByAI,
      timestamp: a.createdAt,
    })),
  });
});

/**
 * PATCH /api/alerts/:id/resolve
 *
 * Marks an alert as resolved.
 */
export const resolveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alert = await Alert.findByIdAndUpdate(
    id,
    { status: "resolved" },
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

