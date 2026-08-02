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
      aiConfidence: d.confidence,
      windSpeed: d.hazardType,
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

  // Find 1 random available team
  const availableTeams = await Team.find({ status: 'available' });
  let assignedTeamIds = [];
  if (availableTeams.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableTeams.length);
    const randomTeam = availableTeams[randomIndex];
    assignedTeamIds.push(randomTeam._id);
    
    randomTeam.status = 'travelling';
    await randomTeam.save();
    
    if (!alert.deployedTeams) alert.deployedTeams = [];
    alert.deployedTeams.push(randomTeam._id);
    await alert.save();
  }

  const deployment = await Deployment.create({
    alertId: alert._id,
    alertTitle: alert.title,
    location: alert.affectedHubs?.[0]?.hubName || "Unknown",
    severity: alert.severity,
    confidence: alert.confidence,
    hazardType: alert.hazardType,
    status: assignedTeamIds.length > 0 ? 'pending' : 'pending',
    assignedTeamIds: assignedTeamIds,
  });

  res.status(201).json({ success: true, deployment });
});

// PATCH /api/deployments/:id
export const updateDeployment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const oldDeployment = await Deployment.findById(id);
  if (!oldDeployment) {
    throw new ApiError(404, "Deployment not found");
  }
  
  const alert = await Alert.findById(oldDeployment.alertId);

  // 1. Handle Assigned Teams logic (New teams added / removed)
  if (req.body.assignedTeamIds) {
    const oldIds = oldDeployment.assignedTeamIds.map(id => id.toString());
    const newIds = req.body.assignedTeamIds.map(id => id.toString());
    
    // Find newly added teams
    const addedIds = newIds.filter(id => !oldIds.includes(id));
    if (addedIds.length > 0) {
      await Team.updateMany(
        { _id: { $in: addedIds } },
        { $set: { status: 'travelling' } }
      );
      if (alert) {
        if (!alert.deployedTeams) alert.deployedTeams = [];
        addedIds.forEach(id => {
          if (!alert.deployedTeams.includes(id)) {
            alert.deployedTeams.push(id);
          }
        });
      }
    }
    
    // Find removed teams (if any, e.g. relocation)
    const removedIds = oldIds.filter(id => !newIds.includes(id));
    if (removedIds.length > 0) {
      await Team.updateMany(
        { _id: { $in: removedIds } },
        { $set: { status: 'available' } }
      );
      if (alert && alert.deployedTeams) {
        alert.deployedTeams = alert.deployedTeams.filter(id => !removedIds.includes(id.toString()));
      }
    }
  }

  // 2. Handle Status changes
  if (req.body.status && req.body.status !== oldDeployment.status) {
    const activeTeamIds = req.body.assignedTeamIds || oldDeployment.assignedTeamIds;
    
    if (req.body.status === 'rescue-ongoing') {
      // Mark all assigned teams as on-mission
      await Team.updateMany(
        { _id: { $in: activeTeamIds } },
        { $set: { status: 'on-mission' } }
      );
    } else if (req.body.status === 'completed' || req.body.status === 'failed') {
      // Free all teams
      await Team.updateMany(
        { _id: { $in: activeTeamIds } },
        { $set: { status: 'available' } }
      );
      // Decrement the alert deployed teams count
      if (alert && alert.deployedTeams) {
        alert.deployedTeams = alert.deployedTeams.filter(id => !activeTeamIds.includes(id.toString()));
      }
    }
  }
  
  if (alert) await alert.save();

  const deployment = await Deployment.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  // Emit socket events
  import("../services/socket.js").then(({ getIO }) => {
    const io = getIO();

    // Always broadcast the deployment patch
    io.emit("deployment_updated", { deploymentId: id, update: req.body });

    // Broadcast team status changes so other pages (e.g. /team-management) update
    if (req.body.assignedTeamIds) {
      const oldIds = oldDeployment.assignedTeamIds.map(id => id.toString());
      const newIds = req.body.assignedTeamIds.map(id => id.toString());
      const addedIds = newIds.filter(id => !oldIds.includes(id));
      const removedIds = oldIds.filter(id => !newIds.includes(id));
      if (addedIds.length > 0) {
        io.emit("teams_updated", { teamIds: addedIds, status: 'travelling' });
      }
      if (removedIds.length > 0) {
        io.emit("teams_updated", { teamIds: removedIds, status: 'available' });
      }
    }

    if (req.body.status && req.body.status !== oldDeployment.status) {
      const activeTeamIds = (req.body.assignedTeamIds || oldDeployment.assignedTeamIds).map(id => id.toString());
      if (req.body.status === 'rescue-ongoing') {
        io.emit("teams_updated", { teamIds: activeTeamIds, status: 'on-mission' });
      } else if (req.body.status === 'completed' || req.body.status === 'failed') {
        io.emit("teams_updated", { teamIds: activeTeamIds, status: 'available' });
      }
    }
  }).catch(err => console.error(err));

  res.status(200).json({ success: true, deployment });
});
