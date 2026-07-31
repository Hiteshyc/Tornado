import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import safetyGuideRoutes from "./routes/safetyGuideRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";

import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { initSocket } from "./services/socket.js";

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, env.clientUrl);

// Middleware
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/internal/token", tokenRoutes);

// Routes
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/safety-guides", safetyGuideRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/user", userRoutes);


// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();

  server.listen(env.port, () => {
    console.log(
      `Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`,
    );
  });
}

startServer();
