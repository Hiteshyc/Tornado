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
      locationName: a.locationName,
      lat: a.location?.coordinates?.[1] ?? 0, // Latitude is second in GeoJSON [Lng, Lat]
      lng: a.location?.coordinates?.[0] ?? 0, // Longitude is first in GeoJSON [Lng, Lat]
      expectedHours: a.expectedHours,
      action: a.action,
      timestamp: a.createdAt,
    })),
  });
});

