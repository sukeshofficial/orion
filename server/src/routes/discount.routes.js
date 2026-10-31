import { Router } from "express";
import {
  createDiscount,
  listDiscounts,
  getDiscount,
  updateDiscount,
  updateDiscountStatus,
} from "../controllers/discount.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// List discounts (admin, staff with discount.read, or customer for browsing active discounts)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listDiscounts
);

// Get single discount
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getDiscount
);

// Create discount (admin or staff with discount.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.DISCOUNT_CREATE),
  createDiscount
);

// Update discount (admin or staff with discount.update)
router.patch(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.DISCOUNT_UPDATE),
  updateDiscount
);

// Update discount status
router.patch(
  "/:id/status",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER),
  requirePermission(PERMISSIONS.DISCOUNT_UPDATE),
  updateDiscountStatus
);

export default router;
