import mongoose from "mongoose";

const safetyGuideSchema = new mongoose.Schema(
  {
    // Unique slug used to look up a guide, e.g. "cyclone", "flood"
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Emoji or icon identifier, e.g. "🌀"
    icon: {
      type: String,
      required: true,
    },
    dos: {
      type: [String],
      default: [],
    },
    donts: {
      type: [String],
      default: [],
    },
    // Display order in the grid
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

safetyGuideSchema.index({ order: 1 });


const SafetyGuide = mongoose.model("SafetyGuide", safetyGuideSchema);

export default SafetyGuide;
