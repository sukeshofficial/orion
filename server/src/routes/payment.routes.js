import { Router } from "express";
import {
  createPayment,
  listPayments,
  getPayment,
} from "../controllers/payment.controller.js";
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../config/permissions.js";
import { USER_ROLES } from "../config/roles.js";

const router = Router();

router.use(authenticate);

// Record payment (Admin or Staff with payment.create)
router.post(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  createPayment
);

// List payments (Admin, Staff with payment.read, or Customers reading their own)
router.get(
  "/",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  listPayments
);

// Get single payment details (Admin, Staff, or Customer owner)
router.get(
  "/:id",
  requireRole(USER_ROLES.ADMIN, USER_ROLES.INTERNAL_USER, USER_ROLES.USER),
  getPayment
);

export default router;
