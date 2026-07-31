import { Router } from "express";
import { getDeployments, createDeployment, updateDeployment } from "../controllers/deploymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = Router();

router.use(protect);
router.use(authorizeRoles("officer", "admin", "teamLead"));

router.get("/", getDeployments);
router.post("/", createDeployment);
router.patch("/:id", updateDeployment);

export default router;
