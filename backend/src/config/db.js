import mongoose from "mongoose";
import { env } from "./env.js";
import dns from "dns";

// ── Primary connection: Login database (users, refreshtokens) ──────────────
export async function connectDB() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    await mongoose.connect(env.mongoUri);
    console.log("Login DB connected");
  } catch (err) {
    console.error("Login DB connection failed:", err.message);
    process.exit(1);
  }
}

// ── Secondary connection: Reports database (User_Reports) ──────────────────
// Using createConnection so it is completely separate from the Login connection
let reportsDb;

export async function connectReportsDB() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    reportsDb = await mongoose.createConnection(env.mongoUriReports).asPromise();
    console.log("Reports DB connected");
  } catch (err) {
    console.error("Reports DB connection failed:", err.message);
    process.exit(1);
  }
}

// Export so models can bind to this specific connection
export function getReportsDb() {
  if (!reportsDb) {
    throw new Error("Reports DB not connected yet. Call connectReportsDB() first.");
  }
  return reportsDb;
}
