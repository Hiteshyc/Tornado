import mongoose from "mongoose";

const missionReportSchema = new mongoose.Schema({
  teamLead: { type: String, required: true },
  completionTime: { type: String, required: true },
  peopleRescued: { type: Number, required: true },
  submittedAt: { type: String, required: true },
  resourcesUsed: [{ type: String }],
  remarks: { type: String },
});

const deploymentSchema = new mongoose.Schema(
  {
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      required: true,
    },
    // We can pull these statically from the alert to avoid deep population if preferred,
    // but typically we'll just populate `alertId`. For simplicity in matching frontend,
    // let's cache some fields that are relevant at the time of deployment.
    alertTitle: { type: String, required: true },
    location: { type: String, required: true },
    severity: {
      type: String,
      enum: ["critical", "high", "moderate", "low", "safe"],
      required: true,
    },
    aiConfidence: { type: Number, default: 0 },
    windSpeed: { type: Number, default: 0 },
    
    assignedTeamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "en-route", "rescue-ongoing", "completed", "failed"],
      default: "pending",
    },
    startTime: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    missionReport: {
      type: missionReportSchema,
      default: null,
    },
  },
  { timestamps: true }
);

export const Deployment = mongoose.model("Deployment", deploymentSchema);
