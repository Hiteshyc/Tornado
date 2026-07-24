import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import { env } from "./config/env.js";
import { connectDB, connectReportsDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Sanitize user-supplied data to prevent MongoDB NoSQL operator injection ($ or .)
app.use(mongoSanitize());

app.use("/api/internal/token", tokenRoutes);

// Routes
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();           // Login database (users, refreshtokens)
  await connectReportsDB();    // Reports database (User_Reports)

  app.listen(env.port, () => {
    console.log(
      `Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`,
    );
  });
}

startServer();
