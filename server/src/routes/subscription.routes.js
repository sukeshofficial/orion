import { Router } from "express";
import {
  createSubscription,
  listSubscriptions,
  getSubscription,
  updateSubscription,
  confirmSubscription,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  closeSubscription,
} from "../controllers/subscription.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// List subscriptions (Admin, Staff with subscription.read, or Customers reading their own)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listSubscriptions
);

// Get single subscription
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getSubscription
);

// Create subscription directly (Admin or Staff with subscription.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.SUBSCRIPTION_CREATE),
  createSubscription
);

// Update subscription settings (Admin or Staff with subscription.update)
router.patch(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  updateSubscription
);

// Confirm subscription
router.post(
  "/:id/confirm",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  confirmSubscription
);

// Activate subscription
router.post(
  "/:id/activate",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  activateSubscription
);

// Pause subscription (Admin, Staff, or Customer if plan rules permit)
router.post(
  "/:id/pause",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  pauseSubscription
);

// Resume subscription (Admin, Staff, or Customer)
router.post(
  "/:id/resume",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  resumeSubscription
);

// Renew subscription
router.post(
  "/:id/renew",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.SUBSCRIPTION_UPDATE),
  renewSubscription
);

// Close subscription (Admin, Staff, or Customer if plan rules permit)
router.post(
  "/:id/close",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  closeSubscription
);

export default router;
