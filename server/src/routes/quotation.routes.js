import { Router } from "express";
import {
  createQuotation,
  listQuotations,
  getQuotation,
  updateQuotation,
  confirmQuotation,
  cancelQuotation,
} from "../controllers/quotation.controller.js";
import { convertQuotation } from "../controllers/subscription.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// List quotations (Admin, Staff with quotation.read, or Customers listing their own)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listQuotations
);

// Get single quotation details (Admin, Staff with quotation.read, or Customer owner)
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getQuotation
);

// Create quotation (Admin or Staff with quotation.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.QUOTATION_CREATE),
  createQuotation
);

// Update quotation (Admin or Staff with quotation.update)
router.patch(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.QUOTATION_UPDATE),
  updateQuotation
);

// Confirm quotation (Customer owner or Admin/Staff with quotation.update)
router.post(
  "/:id/confirm",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  confirmQuotation
);

// Cancel quotation (Customer owner or Admin/Staff with quotation.update)
router.post(
  "/:id/cancel",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  cancelQuotation
);

// Convert quotation to subscription (Admin, Staff, or Customer owner)
router.post(
  "/:id/convert",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  convertQuotation
);

export default router;
