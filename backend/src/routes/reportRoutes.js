import { Router } from "express";
import { submitReport } from "../controllers/reportController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";
import { upload } from "../config/upload.js";

const router = Router();

// POST /api/reports — up to 10 media files under the field name "media"
router.post("/", optionalProtect, upload.array("media", 10), submitReport);

export default router;
