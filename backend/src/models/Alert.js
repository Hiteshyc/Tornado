import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ["critical", "high", "moderate", "low", "safe"],
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    // GeoJSON point for geospatial queries later
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    expectedHours: {
      type: Number,
      required: true,
      min: 0,
    },
    // The recommended action text shown on the alert card
    action: {
      type: String,
      required: true,
      trim: true,
    },
    // Whether this alert is currently visible to users
    isActive: {
      type: Boolean,
      default: true,
    },
    // The admin/authority user who created this alert
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true } // createdAt used as "timestamp" on the frontend
);

// 2dsphere index for future location-based queries
alertSchema.index({ coordinates: "2dsphere" });
alertSchema.index({ severity: 1, isActive: 1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
