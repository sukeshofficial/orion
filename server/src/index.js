import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
try {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`📥 Test Input: http://localhost:${PORT}/api/v1/test-input`);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    server.close(() => {
      console.log("Server closed successfully");
      process.exit(0);
    });
  });

  process.on("SIGTERM", () => {
    server.close(() => {
      console.log("Server closed successfully");
      process.exit(0);
    });
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}
