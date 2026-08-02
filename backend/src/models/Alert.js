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
    hazardType: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "deployment_initiated", "resolved"],
      default: "active",
    },
    eta: {
      type: Number, // Expected hours or timestamp, using Number for simplicity
      required: true,
    },
    affectedHubs: [
      {
        hubId: String,
        hubName: String,
        latitude: Number,
        longitude: Number,
        priority: Number,
        estimatedPopulation: Number,
        requiredRescueCapacity: Number,
        requiredResources: [String],
      },
    ],
    reportId: { type: String },
    reportUrl: { type: String },
    deploymentStatus: {
      type: String,
      enum: ["pending", "deployed"],
      default: "pending",
    },
    deployedTeams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    createdByAI: {
      type: Boolean,
      default: true,
    },
    // The recommended action text shown on the alert card
    action: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

alertSchema.index({ severity: 1, status: 1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
