import { Router } from "express";
import {
  createTax,
  listTaxes,
  getTax,
  updateTax,
  updateTaxStatus,
} from "../controllers/tax.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// List taxes (admin or staff with tax.read, or customer reading active catalog taxes)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listTaxes
);

// Get single tax
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getTax
);

// Create tax (admin or staff with tax.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.TAX_CREATE),
  createTax
);

// Update tax (admin or staff with tax.update)
router.patch(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.TAX_UPDATE),
  updateTax
);

// Update tax status
router.patch(
  "/:id/status",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.TAX_UPDATE),
  updateTaxStatus
);

export default router;
