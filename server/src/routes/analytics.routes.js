import { Router } from "express";
import {
  getOverview,
  getRevenue,
  getSubscriptions,
  getInvoices,
  getPayments,
} from "../controllers/analytics.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// All analytics routes require Admin or Internal Staff with analytics.read
router.use(requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER));
router.use(requirePermission(PERMISSIONS.ANALYTICS_READ));

// 1. Overview analytics
router.get("/overview", getOverview);

// 2. Revenue analytics
router.get("/revenue", getRevenue);

// 3. Subscription analytics
router.get("/subscriptions", getSubscriptions);

// 4. Invoice analytics
router.get("/invoices", getInvoices);

// 5. Payment analytics
router.get("/payments", getPayments);

export default router;
