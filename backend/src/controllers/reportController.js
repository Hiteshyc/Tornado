import { getUserReportModel } from "../models/UserReport.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toBool(val) {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().toLowerCase() === "true";
  return Boolean(val);
}

// POST /api/reports
// Accepts multipart/form-data (files + JSON "data" field)
// Works for both logged-in users and guests
export const submitReport = asyncHandler(async (req, res) => {
  const UserReport = getUserReportModel();

  // ── Parse payload ──────────────────────────────────────────────────────────
  let payload = {};
  if (req.body?.data) {
    try {
      payload = JSON.parse(req.body.data);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid JSON in 'data' field" });
    }
  } else {
    payload = req.body || {};
  }

  const {
    guestName,      // guest only
    guestContact,   // guest only (phone)
    guestEmail,     // guest only (email)
    location,
    locationCoords,      // { lat, lng } from GPS / address geocoding
    locationAccuracy,
    landmark,
    disasterType,
    severity,
    description,
    rescueRequired,
    rescueDetails,
  } = payload;

  // Build GeoJSON Point from locationCoords when available
  // GeoJSON order is [longitude, latitude]
  const geoPoint =
    locationCoords?.lat != null && locationCoords?.lng != null
      ? { type: "Point", coordinates: [locationCoords.lng, locationCoords.lat] }
      : undefined;

  // ── Auth ───────────────────────────────────────────────────────────────────
  const user   = req.user || null;
  const userId = user?._id || null;

  // ── Reporter snapshot ──────────────────────────────────────────────────────
  const reporterName  = user?.name  || guestName    || null;
  const reporterPhone = user?.phone || guestContact || null;
  const reporterEmail = user?.email || guestEmail   || null;

  // ── Required field validation ───────────────────────────────────────────────
  if (!disasterType) {
    return res.status(400).json({ success: false, message: "disasterType is required" });
  }
  if (!location) {
    return res.status(400).json({ success: false, message: "location is required" });
  }
  const severityNum = Number(severity);
  if (severity === undefined || severity === null || Number.isNaN(severityNum)) {
    return res.status(400).json({ success: false, message: "severity must be a valid number" });
  }

  const rescueRequiredBool = toBool(rescueRequired);

  // ── Media files (Cloudinary URLs set by multer-storage-cloudinary) ──────────
  const mediaUrls = req.files?.length
    ? req.files.map((f) => f.path)
    : [];

  // ── Save report ───────────────────────────────────────────────────────────
  let report;
  try {
    report = await UserReport.create({
      userId,

      // Always-stored reporter snapshot
      reporterName,
      reporterPhone,
      reporterEmail,

      // Location & GPS Coords (fed ONLY by GPS / user address)
      location,
      locationCoords: locationCoords || { lat: null, lng: null },
      locationAccuracy: locationAccuracy || null,
      geoPoint,   // GeoJSON Point for geospatial queries (undefined if coords unavailable)

      landmark: landmark || null,

      disasterType,
      severity: severityNum,
      description: description || null,

      rescueRequired: rescueRequiredBool,
      rescueDetails: rescueRequiredBool ? rescueDetails || null : null,

      mediaUrls,

      submittedAt: new Date(),
      status: "pending",
    });
  } catch (err) {
    console.error("Failed to save report:", err);
    return res.status(500).json({ success: false, message: "Failed to save report" });
  }

  res.status(201).json({
    success: true,
    message: "Report submitted successfully",
    reportId: report._id,
  });
});