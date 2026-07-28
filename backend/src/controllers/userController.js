import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import { generateSalt } from "../utils/generateSalt.js";
import { env } from "../config/env.js";
import UserReport from "../models/UserReport.js";

/**
 * GET /api/user/:userId
 *
 * Controller function to fetch and return user profile details by ID.
 * Filters and sanitizes sensitive fields before sending back to the client.
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User profile not found");
  }

  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      preferences: user.preferences || { theme: "light" },
      isOnboarded: user.isOnboarded || false,
      locationConsent: user.locationConsent || false,
      address: user.address || null,
      location: user.location || null,
      dob: user.dob || null,
      gender: user.gender || null,
      emergency: user.emergency || { bloodGroup: null, medicalConditions: null, specialAssistance: false },
      lastLogin: user.lastLogin || null,
    },
  });
});

/**
 * PATCH /api/user/onboarding
 *
 * Controller function to complete user onboarding by adding contact number,
 * theme preferences, and address details. Converts typed addresses to lat/long
 * coordinates using Nominatim OpenStreetMap API if HTML5 Geolocation was denied.
 */
export const completeOnboarding = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { phone, address, coordinates, preferences, locationConsent } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone number is required to complete onboarding.");
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // 1. Set Contact Phone Number
  user.phone = phone;

  // 2. Set Preferences
  if (preferences?.theme) {
    user.preferences = { theme: preferences.theme };
  }

  // 3. Resolve and Set Coordinates & Address
  const newAddress = {
    street: address?.street || "",
    city: address?.city || "",
    state: address?.state || "",
    zipCode: address?.zipCode || "",
    formattedAddress: `${address?.street || ""}, ${address?.city || ""}, ${address?.state || ""}, ${address?.zipCode || ""}`,
  };

  user.address = newAddress;

  const newLocation = {
    type: "Point",
    coordinates: [0, 0], // Default fallback [longitude, latitude]
  };

  if (coordinates && coordinates.latitude !== undefined && coordinates.longitude !== undefined) {
    // Case A: Geolocation was allowed. Save coordinates directly (GeoJSON order is [Lng, Lat])
    newLocation.coordinates = [
      parseFloat(coordinates.longitude),
      parseFloat(coordinates.latitude),
    ];
    user.location = newLocation;
  } else if (newAddress.city) {
    // Case B: Geolocation was denied. Geo-encode address using Nominatim
    // Try precise full address first, then fall back to city + state only
    const geocodeAttempts = [
      // Attempt 1: most specific — full formatted address
      `${newAddress.street ? newAddress.street + ", " : ""}${newAddress.city}, ${newAddress.state}, India`,
      // Attempt 2: less specific — just city + state (more reliable match)
      `${newAddress.city}, ${newAddress.state}, India`,
    ].filter(Boolean);

    let geocoded = false;
    for (const query of geocodeAttempts) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;

        const geocodeRes = await fetch(url, {
          headers: { "User-Agent": "Coastal-Hazard-Prevention-System" },
        });

        if (geocodeRes.ok) {
          const results = await geocodeRes.json().catch(() => []);
          if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lon = parseFloat(results[0].lon);
            if (!isNaN(lat) && !isNaN(lon)) {
              newLocation.coordinates = [lon, lat]; // GeoJSON: [lng, lat]
              geocoded = true;
              break; // Stop at first successful result
            }
          }
        }
      } catch (err) {
        console.warn(`[Onboarding Geocoder] Attempt failed for "${query}":`, err.message);
      }
    }

    if (!geocoded) {
      console.warn("[Onboarding Geocoder] All geocoding attempts failed. Coordinates left at [0,0].");
    }

    user.location = newLocation;
  }

  // Mark user as onboarded to unlock dashboard access
  user.isOnboarded = true;
  user.locationConsent = locationConsent === true;

  await user.save();

  res.status(200).json({
    message: "Onboarding completed successfully.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      preferences: user.preferences,
      isOnboarded: user.isOnboarded,
      locationConsent: user.locationConsent,
      address: user.address,
      location: user.location,
      dob: user.dob || null,
      gender: user.gender || null,
      emergency: user.emergency || { bloodGroup: null, medicalConditions: null, specialAssistance: false },
      lastLogin: user.lastLogin || null,
    },
  });
});

/**
 * PATCH /api/user/:userId
 *
 * Controller function to update user profile details.
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const loggedInUserId = req.user._id;

  // Ensure users can only update their own profile
  if (userId !== loggedInUserId.toString()) {
    throw new ApiError(403, "You are not authorized to update this profile");
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { name, phone, dob, gender, address, emergency, password } = req.body;

  if (password) {
    const salt = generateSalt(name || user.name, user.email);
    const passwordHash = await bcrypt.hash(password + salt, env.bcryptCostFactor);
    user.passwordHash = passwordHash;
    user.salt = salt;
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (dob !== undefined) user.dob = dob;
  if (gender !== undefined) user.gender = gender;
  
  if (address !== undefined) {
    const formattedAddress = address.formattedAddress || `${address.street || ""}, ${address.city || ""}, ${address.state || ""}, ${address.zipCode || ""}`;
    // Only update and re-geocode if the address actually changed
    if (user.address?.formattedAddress !== formattedAddress) {
      user.address = {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
        formattedAddress,
      };

      // Recalculate coordinates using Nominatim OSM API
      try {
        const query = `${formattedAddress}, India`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
        
        const geocodeRes = await fetch(url, {
          headers: { "User-Agent": "Coastal-Hazard-Prevention-System" },
        });

        if (geocodeRes.ok) {
          const results = await geocodeRes.json().catch(() => []);
          if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lon = parseFloat(results[0].lon);
            if (!isNaN(lat) && !isNaN(lon)) {
              user.location = {
                type: "Point",
                coordinates: [lon, lat], // GeoJSON order: [Lng, Lat]
              };
            }
          }
        }
      } catch (err) {
        console.warn(`[Profile Geocoder] Failed to geocode address "${formattedAddress}":`, err.message);
      }
    }
  }

  if (emergency !== undefined) {
    user.emergency = {
      bloodGroup: emergency.bloodGroup || null,
      medicalConditions: emergency.medicalConditions || null,
      specialAssistance: emergency.specialAssistance === true,
    };
  }

  await user.save();

  res.status(200).json({
    message: "Profile updated successfully.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      preferences: user.preferences || { theme: "light" },
      isOnboarded: user.isOnboarded || false,
      locationConsent: user.locationConsent || false,
      address: user.address || null,
      location: user.location || null,
      dob: user.dob || null,
      gender: user.gender || null,
      emergency: user.emergency || { bloodGroup: null, medicalConditions: null, specialAssistance: false },
      lastLogin: user.lastLogin || null,
    },
  });
});

/**
 * GET /api/user/:userId/reports
 *
 * Controller function to fetch reports made by a specific user.
 */
export const getUserReports = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const loggedInUserId = req.user._id;

  // Ensure users can only view their own reports
  if (userId !== loggedInUserId.toString()) {
    throw new ApiError(403, "You are not authorized to view these reports");
  }

  const reports = await UserReport.find({ userId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    reports,
  });
});

/**
 * PATCH /api/user/:userId/profile-image
 *
 * Controller function to upload a profile image.
 */
export const updateProfileImage = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const loggedInUserId = req.user._id;

  if (userId !== loggedInUserId.toString()) {
    throw new ApiError(403, "You are not authorized to update this profile");
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!req.file) {
    throw new ApiError(400, "No image file provided");
  }

  // The Cloudinary URL is available in req.file.path
  user.profileImage = req.file.path;
  await user.save();

  res.status(200).json({
    message: "Profile image updated successfully.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      preferences: user.preferences || { theme: "light" },
      isOnboarded: user.isOnboarded || false,
      locationConsent: user.locationConsent || false,
      address: user.address || null,
      location: user.location || null,
      dob: user.dob || null,
      gender: user.gender || null,
      emergency: user.emergency || { bloodGroup: null, medicalConditions: null, specialAssistance: false },
      lastLogin: user.lastLogin || null,
    },
  });
});
