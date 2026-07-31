import { Team } from "../models/Team.js";
import { getIO } from "../services/socket.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all teams
export const getAllTeams = async (req, res, next) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error) {
    next(error);
  }
};

// Create a new team
export const createTeam = async (req, res, next) => {
  try {
    const team = new Team(req.body);
    const savedTeam = await team.save();
    res.status(201).json(savedTeam);
  } catch (error) {
    next(error);
  }
};

// Update team details
export const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedTeam = await Team.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!updatedTeam) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    try {
      getIO().emit("team_updated", updatedTeam);
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }
    
    res.json(updatedTeam);
  } catch (error) {
    next(error);
  }
};

// Update team location/status (specifically for the simulation)
export const updateTeamLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng, label, status } = req.body;
    
    const updateData = {};
    if (lat !== undefined && lng !== undefined) {
      updateData.gps = { lat, lng, label: label || 'Updated Location' };
    }
    if (status) {
      updateData.status = status;
    }
    
    const updatedTeam = await Team.findByIdAndUpdate(id, { $set: updateData }, {
      new: true,
      runValidators: true,
    });
    
    if (!updatedTeam) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    try {
      getIO().emit("team_updated", updatedTeam);
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }
    
    res.json(updatedTeam);
  } catch (error) {
    next(error);
  }
};

// Delete team
export const deleteTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedTeam = await Team.findByIdAndDelete(id);
  if (!deletedTeam) {
    return res.status(404).json({ message: "Team not found" });
  }
  res.status(200).json({ message: "Team deleted successfully" });
});

// @desc    Send a message/instruction to a team
// @route   POST /api/teams/:id/message
// @access  Private (Officer)
export const sendMessageToTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ message: "Message text is required" });
  }

  const team = await Team.findById(id);
  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }

  try {
    getIO().emit("team_message", { teamId: id, message, timestamp: new Date() });
  } catch (err) {
    console.error("Socket error emitting team_message:", err);
  }

  res.status(200).json({ success: true, message: "Message sent to team" });
});
