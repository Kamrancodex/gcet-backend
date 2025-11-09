import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/auth";
import studentRoutes from "./routes/students";
import adminRoutes from "./routes/admin";
import libraryRoutes from "./routes/library";
import libraryStudentRoutes from "./routes/library-student";
import admissionsRoutes from "./routes/admissions";
import registrationRoutes from "./routes/registration";
import noticesRoutes from "./routes/notices";
import socialRoutes from "./routes/social";
import lostFoundRoutes from "./routes/lostfound";
import notificationRoutes from "./routes/notifications";
import uploadthingRoutes from "./routes/uploadthing"; // Placeholder implementation - returns 501
import branchesRoutes from "./routes/branches";
import aiRoutes from "./routes/ai";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env["PORT"] || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env["FRONTEND_URL"] || "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/library", libraryStudentRoutes);
app.use("/api/admissions", admissionsRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/lostfound", lostFoundRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/", uploadthingRoutes); // Placeholder implementation - returns 501

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env["MONGODB_URI"];
    if (!mongoURI) {
      console.log("⚠️  MONGODB_URI not found, running without database");
      return;
    }

    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    console.log("⚠️  Continuing without database connection");
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 GCET College Management System`);
      console.log(
        `🌐 Environment: ${process.env["NODE_ENV"] || "development"}`
      );
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM received, shutting down gracefully");
  mongoose.connection.close().then(() => {
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🔄 SIGINT received, shutting down gracefully");
  mongoose.connection.close().then(() => {
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  });
});

startServer();
