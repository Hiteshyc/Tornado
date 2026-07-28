import mongoose from "mongoose";
import { getReportsDb } from "../config/db.js";

const userReportSchema = new mongoose.Schema(
  {
    // ── User reference ──────────────────────────────────────────────────────
    // For logged-in users: store only their ID (reference to Login.users)
    // For guests: userId stays null
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // links to the User model in the Login database
      default: null,
    },

    // ── Reporter snapshot (always stored — self-contained, no join needed) ───
    reporterName: {
      type: String,
      trim: true,
      default: null,
    },
    reporterPhone: {
      type: String,
      trim: true,
      default: null,
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    // ── Location & IP Tracking ────────────────────────────────────────────────
    location: {
      type: String,   // 1) human-readable address (editable by user)
      required: true,
      trim: true,
    },
    locationCoords: {
      lat: { type: Number, default: null },  // 2) latitude & longitude by GPS or address geocoding
      lng: { type: Number, default: null },
    },
    locationAccuracy: {
      type: Number,   // accuracy in metres (e.g. ±15m if GPS used)
      default: null,
    },
    geoPoint: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],  // [longitude, latitude] — GeoJSON order
        default: undefined,
      },
    },

    // Hidden internal fields (auto-captured on backend)
    ipAddress: {
      type: String,   // 3) client IP address
      trim: true,
      default: null,
    },
    ipCoords: {
      lat: { type: Number, default: null },  // 4) latitude & longitude derived from IP address
      lng: { type: Number, default: null },
    },

    // ── Landmark ──────────────────────────────────────────────────────────────
    landmark: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Event details ─────────────────────────────────────────────────────────
    disasterType: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Rescue ────────────────────────────────────────────────────────────────
    rescueRequired: {
      type: Boolean,
      default: false,
    },
    rescueDetails: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Media ─────────────────────────────────────────────────────────────────
    mediaUrls: {
      type: [String],
      default: [],
    },

    // ── Timestamp ─────────────────────────────────────────────────────────────
    submittedAt: {
      type: Date,
      default: Date.now,
    },

    // ── Status (for officers to update later) ────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "acknowledged", "resolved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// 2dsphere index enables MongoDB geospatial queries ($near, $geoWithin etc.)
userReportSchema.index({ geoPoint: "2dsphere" }, { sparse: true });

export function getUserReportModel() {
  const db = getReportsDb();
  return db.models.UserReport || db.model("UserReport", userReportSchema, "User_Reports");
}

const UserReport = getUserReportModel();
export default UserReport;
