import { Router } from "express";
import { submitReport } from "../controllers/reportController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/reports
// optionalProtect: attaches req.user if a valid token cookie exists,
// but does NOT reject the request if unauthenticated (allows guest submissions)
router.post("/", optionalProtect, submitReport);

export default router;
