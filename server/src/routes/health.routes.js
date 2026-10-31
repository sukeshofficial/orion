
import { Router } from "express";

const router = Router();

function getHealthMetrics() {
  const memory = process.memoryUsage();
  return {
    success: true,
    status: "healthy",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: `${Math.round(memory.rss / (1024 * 1024))}MB`,
      heapUsed: `${Math.round(memory.heapUsed / (1024 * 1024))}MB`,
      heapTotal: `${Math.round(memory.heapTotal / (1024 * 1024))}MB`,
    },
  };
}

// Regular snapshot endpoint
router.get("/", (req, res) => {
  res.status(200).json(getHealthMetrics());
});

// SSE Continuous stream endpoint: /dev/health/status
router.get("/status", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  // Send initial snapshot immediately
  const initialData = getHealthMetrics();
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  // Stream metrics every 5 seconds
  const metricInterval = setInterval(() => {
    const data = getHealthMetrics();
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 5000);

  // Keep-alive heartbeat every 20 seconds
  const heartbeatInterval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 20000);

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(metricInterval);
    clearInterval(heartbeatInterval);
    res.end();
  });
});

export default router;
