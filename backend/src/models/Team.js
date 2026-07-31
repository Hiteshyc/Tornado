import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
});

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    leader: { type: String, required: true },
    vehicle: {
      type: String,
      enum: ['Rescue Boat', 'Fire Truck', 'Helicopter', 'Amphibious Vehicle', 'Ambulance'],
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'on-mission', 'travelling', 'offline'],
      default: 'available',
    },
    hub: { type: String, required: true },
    members: [teamMemberSchema],
    equipment: [{ type: String }],
    gps: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      label: { type: String, required: true },
    },
    missionStatus: { type: String },
    previousMission: { type: String },
    assignedDeploymentId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Team = mongoose.model("Team", teamSchema);
