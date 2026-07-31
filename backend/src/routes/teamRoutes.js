import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import {
  getAllTeams,
  createTeam,
  updateTeam,
  updateTeamLocation,
  deleteTeam,
  sendMessageToTeam
} from "../controllers/teamController.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('officer'));

router.get("/", getAllTeams);
router.post("/", createTeam);
router.put("/:id", updateTeam);
router.patch("/:id/location", updateTeamLocation);
router.post("/:id/message", sendMessageToTeam);
router.delete("/:id", deleteTeam);

export default router;
