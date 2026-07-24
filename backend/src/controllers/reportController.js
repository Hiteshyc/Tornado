import { getUserReportModel } from "../models/UserReport.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import net from "net";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toBool(val) {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().toLowerCase() === "true";
  return Boolean(val);
}

function isPrivateOrReservedIp(ip) {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    /^169\.254\./.test(ip) || // link-local
    ip.startsWith("fc") || ip.startsWith("fd") // IPv6 unique local
  );
}

async function lookupIpCoords(ipAddress, isPrivate) {
  if (!ipAddress || isPrivate) return { lat: null, lng: null };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const ipRes = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ipAddress)}?fields=status,lat,lon`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData.status === "success") {
        return { lat: ipData.lat, lng: ipData.lon };
      }
    }
  } catch (err) {
    console.warn(`IP geolocation failed for ${ipAddress}:`, err.message);
  }
  return { lat: null, lng: null };
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
    locationCoords,      // raw coordinates provided by GPS / address geocoding
    locationAccuracy,
    landmark,
    disasterType,
    severity,
    description,
    rescueRequired,
    rescueDetails,
  } = payload;

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

  // ── Client IP & IP Geolocation (purely internal audit fields) ──────────────
  const rawIp =
    (Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.headers["x-forwarded-for"]?.split(",")[0]
    )?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null;

  let ipAddress = rawIp ? rawIp.replace(/^::ffff:/, "") : null;
  if (ipAddress && net.isIP(ipAddress) === 0) ipAddress = null;

  const ipAddressIsPrivate = ipAddress ? isPrivateOrReservedIp(ipAddress) : false;

  // IP coordinates are looked up for audit storage ONLY — locationCoords is ONLY fed by GPS / frontend address
  const ipCoords = await lookupIpCoords(ipAddress, ipAddressIsPrivate);

  // ── Save report ───────────────────────────────────────────────────────────
  let report;
  try {
    report = await UserReport.create({
      userId,

      // Always-stored reporter snapshot
      reporterName,
      reporterPhone,
      reporterEmail,

      // Location & GPS Coords (fed ONLY by GPS / user address, NOT IP)
      location,
      locationCoords: locationCoords || { lat: null, lng: null },
      locationAccuracy: locationAccuracy || null,

      // IP Tracking (separate internal fields)
      ipAddress,
      ipCoords,

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