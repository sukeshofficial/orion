import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import healthRoutes from "./routes/health.routes.js";
import testInputRoutes from "./routes/testInput.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import taxRoutes from "./routes/tax.routes.js";
import planRoutes from "./routes/plan.routes.js";
import quotationTemplateRoutes from "./routes/quotationTemplate.routes.js";
import quotationRoutes from "./routes/quotation.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import discountRoutes from "./routes/discount.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();


// Security and middleware
app.use(helmet());
app.use(cookieParser());

// Build the set of explicitly allowed origins from the comma-separated CLIENT_URL env var.
// Each value is trimmed and has trailing slashes stripped for consistent matching.
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean)
);

/**
 * Determines whether a request origin should be allowed.
 * Rules (evaluated in order):
 *   1. No origin header → allow (server-to-server, curl, mobile apps)
 *   2. CLIENT_URL contains "*"  → allow all
 *   3. Origin is explicitly listed in CLIENT_URL → allow
 *   4. Origin matches *.vercel.app → allow (covers all Vercel preview deployments)
 *   5. NODE_ENV is not "production" → allow (local development)
 *   6. Otherwise → reject with CORS error
 */
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/+$/, "");
  if (allowedOrigins.has("*")) return true;
  if (allowedOrigins.has(normalized)) return true;
  // Allow any Vercel preview / production deployment URL automatically
  if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(normalized)) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Ensure DB connection for every request (essential for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    void res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// API routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/test-input", testInputRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/taxes", taxRoutes);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/quotation-templates", quotationTemplateRoutes);
app.use("/api/v1/quotations", quotationRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/discounts", discountRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/payments", paymentRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;