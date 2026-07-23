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

    // ── Guest info (only filled when userId is null) ────────────────────────
    guestName: {
      type: String,
      trim: true,
      default: null,
    },
    guestContact: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Location ─────────────────────────────────────────────────────────────
    location: {
      type: String,   // human-readable address from reverse geocoding
      required: true,
      trim: true,
    },
    locationCoords: {
      lat: { type: Number, default: null },  // raw GPS latitude
      lng: { type: Number, default: null },  // raw GPS longitude
    },
    locationAccuracy: {
      type: Number,   // accuracy in metres (e.g. 8 means ±8m)
      default: null,
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

// Bind to the Reports DB connection — reuse cached model if already registered
export function getUserReportModel() {
  const db = getReportsDb();
  return db.models.UserReport || db.model("UserReport", userReportSchema, "User_Reports");
}
