import { Router } from "express";
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
} from "../controllers/customer.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

// All customer endpoints require authentication
router.use(authenticate);

// ── Customer Management Routes ───────────────────────────────────────────────
// Accessible to Admin and Internal Staff with customer permissions.
// Regular customers / end-users are rejected with 403.

// List customers (admin or staff with customer.read)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.CUSTOMER_READ),
  listCustomers
);

// Retrieve customer details (admin or staff with customer.read)
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.CUSTOMER_READ),
  getCustomer
);

// Create customer record (admin or staff with customer.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.CUSTOMER_CREATE),
  createCustomer
);

// Update customer profile (admin or staff with customer.update)
router.patch(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.CUSTOMER_UPDATE),
  updateCustomer
);

export default router;
