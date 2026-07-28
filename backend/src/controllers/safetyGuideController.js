import { safetyGuideService } from "../services/safetyGuideService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** GET /api/safety-guides */
export const getSafetyGuides = asyncHandler(async (req, res) => {
  const guides = await safetyGuideService.getAll();
  res.status(200).json({ count: guides.length, guides });
});

/** GET /api/safety-guides/key/:key  — used by sidebar drawer */
export const getSafetyGuideByKey = asyncHandler(async (req, res) => {
  const guide = await safetyGuideService.getByKey(req.params.key);
  res.status(200).json({ guide });
});

/** GET /api/safety-guides/:id */
export const getSafetyGuide = asyncHandler(async (req, res) => {
  const guide = await safetyGuideService.getById(req.params.id);
  res.status(200).json({ guide });
});

