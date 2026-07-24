import { refreshService } from "../services/refreshService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const refresh = asyncHandler(async (req, res) => {
  // Accept from httpOnly cookie (browser) or request body (server-to-server calls)
  const rawRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!rawRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  const { accessToken } = await refreshService.refreshAccessToken(rawRefreshToken);

  res.status(200).json({ accessToken });
});
