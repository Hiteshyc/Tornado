import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
    },
  });
});
