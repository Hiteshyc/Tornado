import mongoose from "mongoose";
import { env } from "./env.js";
import dns from "dns";

export async function connectDB() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
