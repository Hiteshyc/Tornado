import mongoose from "mongoose";
import { env } from "./env.js";

let reportsDbConnection = null;

export async function connectDB() {
  try {
    const uri = env.mongoUri || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI / MONGO_URI_LOGIN is not set");
    }
    await mongoose.connect(uri);
    console.log("MongoDB connected (Primary/Login)");
  } catch (err) {
    console.error("MongoDB primary connection failed:", err.message);
    process.exit(1);
  }
}

export async function connectReportsDB() {
  try {
    const uri = env.mongoUriReports || process.env.MONGO_URI_REPORTS || env.mongoUri || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI_REPORTS is not set");
    }
    reportsDbConnection = await mongoose.createConnection(uri).asPromise();
    console.log("MongoDB connected (Secondary/Reports)");
    return reportsDbConnection;
  } catch (err) {
    console.error("MongoDB secondary connection failed:", err.message);
    process.exit(1);
  }
}

export function getReportsDb() {
  if (!reportsDbConnection) {
    const uri = env.mongoUriReports || process.env.MONGO_URI_REPORTS || env.mongoUri || process.env.MONGO_URI;
    reportsDbConnection = mongoose.createConnection(uri);
  }
  return reportsDbConnection;
}
