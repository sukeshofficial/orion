import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
  uploadProfilePicture,
  selectProfilePicture,
  deleteProfilePicture,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  requestEmailVerification,
  confirmEmailVerification,
  staffDashboardOverview,
  testCustomerResource,
} from "../controllers/auth.controller.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";
import { parseMultipartImage } from "../middleware/upload.middleware.js";

const router = Router();

// Rate limiter for authentication endpoints: max 50 requests per 15 mins
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for email verification requests: max 10 requests per 15 mins
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many email verification requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public authentication routes
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/verify-reset-token", verifyResetToken);

// Email verification endpoints
router.post("/email-verification/request", authenticate, verificationLimiter, requestEmailVerification);
router.post("/email-verification/confirm", authLimiter, confirmEmailVerification);

// Development visual preview for email template
if (process.env.NODE_ENV !== "production") {
  router.get("/preview/password-reset", async (req, res) => {
    const { generatePasswordResetTemplate } = await import("../services/email.service.js");
    const sampleHtml = generatePasswordResetTemplate({
      name: req.query.name || "Alex Morgan",
      resetUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=sample_demo_token_1234567890abcdef&email=${encodeURIComponent(
        req.query.email || "alex.morgan@example.com"
      )}`,
      expirationHours: 1,
      year: new Date().getFullYear(),
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(sampleHtml);
  });
}

// Authenticated current-user profile routes
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);
router.patch("/me/password", authenticate, changePassword);

// Profile picture upload, select, and removal (Standard and frontend compatibility endpoints)
router.post("/me/profile-picture", authenticate, parseMultipartImage("profilePic"), uploadProfilePicture);
router.patch("/me/profile-picture/select", authenticate, selectProfilePicture);
router.delete("/me/profile-picture", authenticate, deleteProfilePicture);

// Frontend compatibility aliases for profile picture upload & delete
router.post("/profilePic", authenticate, parseMultipartImage("profilePic"), uploadProfilePicture);
router.post("/profile-pic", authenticate, parseMultipartImage("profilePic"), uploadProfilePicture);
router.patch("/profilePic/select", authenticate, selectProfilePicture);
router.delete("/profilePic", authenticate, deleteProfilePicture);

// Legacy internal staff management route (Protected by authentication + requireRole)
router.get("/staff/dashboard", authenticate, requireRole("internal_user", "internal_staff"), staffDashboardOverview);

// Customer-isolated resource demonstration route (Protected by authentication + ownership check)
router.get("/customer-resource/:ownerId", authenticate, testCustomerResource);

export default router;
