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
    district: {
      type: String,
      required: true,
      trim: true,
    },
    alertType: {
      type: String,
      required: true,
      trim: true,
    },
    locationName: {
      type: String,
      required: true,
      trim: true,
    },
    // GeoJSON Point matching User DB schema for geospatial queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    expectedHours: {
      type: Number,
      required: true,
      min: 0,
    },
    aiConfidence: {
      type: Number,
      default: 0,
    },
    windSpeed: {
      type: Number,
      default: 0,
    },
    population: {
      type: Number,
      default: 0,
    },
    deployedTeams: {
      type: Number,
      default: 0,
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

// 2dsphere index for location-based queries
alertSchema.index({ location: "2dsphere" });
alertSchema.index({ severity: 1, isActive: 1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
