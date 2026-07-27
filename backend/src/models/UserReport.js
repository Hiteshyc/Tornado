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
      match: [/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,"Please enter a valid name", ],
    },
    reporterPhone: {
      type: Number,
      trim: true,
      default: null,
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    // ── Location ──────────────────────────────────────────────────────────────
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
    // GeoJSON Point for geospatial queries (mirrors User.location shape)
    // Populated from locationCoords on the backend
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
      // e.g. "Flood", "Cyclone", "Tsunami", "Other: Custom text"
    },
    severity: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      // 1=Very Low, 2=Low, 3=Moderate, 4=High, 5=Critical
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
    // URLs to uploaded files (stored after uploading to cloud storage later)
    mediaUrls: {
      type: [String],
      default: [],
    },

    // ── Timestamp ─────────────────────────────────────────────────────────────
    // Auto-captured on submit — user never sees or enters this
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
  { timestamps: true }, // also adds createdAt and updatedAt automatically
);

// 2dsphere index enables MongoDB geospatial queries ($near, $geoWithin etc.)
userReportSchema.index({ geoPoint: "2dsphere" }, { sparse: true });

// Bind to the Reports DB connection — reuse cached model if already registered
export function getUserReportModel() {
  const db = getReportsDb();
  return db.models.UserReport || db.model("UserReport", userReportSchema, "User_Reports");
}
