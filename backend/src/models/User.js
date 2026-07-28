import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    userCode: {
      type: String,
      unique: true,
      // e.g. "WS-A3K9X2" — generated at registration, shown on profile
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never return by default on queries
    },
    salt: {
      type: String,
      required: true,
      select: false, // sensitive, hidden by default like passwordHash
    },
    role: {
      type: String,
      enum: ["user", "admin", "officer"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    locationConsent: {
      type: Boolean,
      default: false,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      formattedAddress: String,
    },
    dob: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      default: null,
    },
    emergency: {
      bloodGroup: {
        type: String,
        default: null,
      },
      medicalConditions: {
        type: String,
        default: null,
      },
      specialAssistance: {
        type: Boolean,
        default: false,
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  { timestamps: true }, // adds createdAt, updatedAt
);

// Create geospatial 2dsphere index on location field for emergency map radius queries
userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);

export default User;
