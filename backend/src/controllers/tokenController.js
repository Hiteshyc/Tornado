import { generateAccessToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const issueAccessToken = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  const accessToken = generateAccessToken(userId, role);

  res.status(200).json({ accessToken });
});
