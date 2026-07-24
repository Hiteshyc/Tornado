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
    },
  });
});
