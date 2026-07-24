import { Router } from "express";
import { internalOnly } from "../middleware/internalOnly.js";
import { issueAccessToken } from "../controllers/tokenController.js";

const router = Router();

// Only the backend server itself calls this (see internalOnly middleware).
router.post("/access", internalOnly, issueAccessToken);

export default router;
