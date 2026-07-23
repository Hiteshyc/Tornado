import { getUserReportModel } from "../models/UserReport.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/reports
// Public — works for both logged-in users and guests
export const submitReport = asyncHandler(async (req, res) => {
  const UserReport = getUserReportModel();

  const {
    guestName,
    guestContact,
    location,
    locationCoords,
    locationAccuracy,
    landmark,
    disasterType,
    severity,
    description,
    rescueRequired,
    rescueDetails,
  } = req.body;

  // If a valid JWT cookie is present, req.user is set by optionalProtect middleware
  const userId = req.user?._id || null;

  const report = await UserReport.create({
    // Logged-in user → store userId only (no guest fields)
    userId,
    guestName: userId ? null : guestName || null,
    guestContact: userId ? null : guestContact || null,

    location,
    locationCoords: locationCoords || { lat: null, lng: null },
    locationAccuracy: locationAccuracy || null,
    landmark: landmark || null,

    disasterType,
    severity: Number(severity),
    description: description || null,

    rescueRequired: Boolean(rescueRequired),
    rescueDetails: rescueRequired ? rescueDetails || null : null,

    submittedAt: new Date(), // auto-captured — user never provides this
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Report submitted successfully",
    reportId: report._id,
  });
});
