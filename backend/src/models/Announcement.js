import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    // Full official agency name, e.g. "IMD — India Meteorological Department"
    agency: {
      type: String,
      required: true,
      trim: true,
    },
    // Short category tag shown as a pill badge on the card, e.g. "WEATHER"
    badge: {
      type: String,
      required: true,
      enum: ["WEATHER", "RESPONSE", "EVACUATION", "MARITIME", "HEALTH", "OTHER"],
      uppercase: true,
    },
    // Short title shown in the primary sidebar list
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Full bulletin body shown in the extended drawer
    body: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["critical", "high", "moderate", "low"],
      default: "moderate",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

announcementSchema.index({ priority: 1, isActive: 1 });
announcementSchema.index({ createdAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
