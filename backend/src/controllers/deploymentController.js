import { Deployment } from "../models/Deployment.js";
import Alert from "../models/Alert.js";
import { Team } from "../models/Team.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/deployments
export const getDeployments = asyncHandler(async (req, res) => {
  const deployments = await Deployment.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    deployments: deployments.map(d => ({
      id: d._id,
      alertId: d.alertId,
      alertTitle: d.alertTitle,
      location: d.location,
      severity: d.severity,
      aiConfidence: d.aiConfidence,
      windSpeed: d.windSpeed,
      assignedTeamIds: d.assignedTeamIds,
      status: d.status,
      startTime: d.startTime,
      missionReport: d.missionReport,
    }))
  });
});

// POST /api/deployments
export const createDeployment = asyncHandler(async (req, res) => {
  const { alertId } = req.body;

  const alert = await Alert.findById(alertId);
  if (!alert) {
    throw new ApiError(404, "Alert not found");
  }

  // Check if deployment already exists for this alert
  const existing = await Deployment.findOne({ alertId });
  if (existing && existing.status !== 'completed' && existing.status !== 'failed') {
    return res.status(200).json({ success: true, deployment: existing });
  }

  const deployment = await Deployment.create({
    alertId: alert._id,
    alertTitle: alert.title,
    location: alert.locationName,
    severity: alert.severity,
    aiConfidence: alert.aiConfidence,
    windSpeed: alert.windSpeed,
    status: 'pending',
    assignedTeamIds: [],
  });

  res.status(201).json({ success: true, deployment });
});

// PATCH /api/deployments/:id
export const updateDeployment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const deployment = await Deployment.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!deployment) {
    throw new ApiError(404, "Deployment not found");
  }

  // Emit socket event
  import("../services/socket.js").then(({ getIO }) => {
    getIO().emit("deployment_updated", { deploymentId: id, update: req.body });
  }).catch(err => console.error(err));

  res.status(200).json({ success: true, deployment });
});
