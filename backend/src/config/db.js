import mongoose from "mongoose";
import { env } from "./env.js";
import dns from "dns";

let reportsDbConnection = null;

export async function connectDB() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected (Primary/Login)");
  } catch (err) {
    console.error("MongoDB primary connection failed:", err.message);
    process.exit(1);
  }
}

export function getReportsDb() {
  if (!reportsDbConnection) {
    const reportUri = process.env.MONGO_URI_REPORT || env.mongoUri;
    reportsDbConnection = mongoose.createConnection(reportUri);
    
    reportsDbConnection.on("connected", () => {
      console.log("MongoDB connected (Secondary/Reports)");
    });
    
    reportsDbConnection.on("error", (err) => {
      console.error("MongoDB secondary connection error:", err.message);
    });
  }
  return reportsDbConnection;
}

let officerDbConnection = null;

export function getOfficerDb() {
  if (!officerDbConnection) {
    const officerUri = process.env.MONGO_URI_OFFICER || env.mongoUri;
    officerDbConnection = mongoose.createConnection(officerUri);
    
    officerDbConnection.on("connected", () => {
      console.log("MongoDB connected (Operational/Officer)");
    });
    
    officerDbConnection.on("error", (err) => {
      console.error("MongoDB operational connection error:", err.message);
    });
  }
  return officerDbConnection;
}
