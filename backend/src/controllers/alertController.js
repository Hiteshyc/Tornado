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

/**
 * GET /api/alerts/nearby
 *
 * Fetches active alerts within a designated radius of coordinates.
 * Query Params:
 *   - lat: Latitude
 *   - lng: Longitude
 *   - radius: Radius in kilometers (defaults to 50km)
 */
export const getNearbyAlerts = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 50 } = req.query;

  if (!lat || !lng) {
    throw new ApiError(400, "Latitude and Longitude query parameters are required.");
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const parsedRadius = parseFloat(radius);

  if (isNaN(parsedLat) || isNaN(parsedLng) || isNaN(parsedRadius)) {
    throw new ApiError(400, "Latitude, Longitude, and Radius must be valid numbers.");
  }

  // Find active alerts near the coordinates inside the maximum distance (meters)
  const alerts = await Alert.find({
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parsedLng, parsedLat], // GeoJSON order is [longitude, latitude]
        },
        $maxDistance: parsedRadius * 1000, // Convert km to meters
      },
    },
  });

  res.status(200).json({
    success: true,
    alerts: alerts.map(a => ({
      id: a._id,
      title: a.title,
      severity: a.severity,
      locationName: a.locationName,
      lat: a.location?.coordinates?.[1] ?? 0,
      lng: a.location?.coordinates?.[0] ?? 0,
      expectedHours: a.expectedHours,
      action: a.action,
      timestamp: a.createdAt,
    })),
  });
});
